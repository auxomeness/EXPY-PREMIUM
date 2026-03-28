import type { CurrencySettings, SupportedCurrency, UserData } from "../App";
import { getUserData, saveUserData } from "./userData";

export const SUPPORTED_CURRENCIES: Array<{
  code: SupportedCurrency;
  label: string;
  locale: string;
}> = [
  { code: "PHP", label: "Philippine Peso", locale: "en-PH" },
  { code: "USD", label: "U.S. Dollar", locale: "en-US" },
  { code: "EUR", label: "Euro", locale: "en-IE" },
  { code: "CNY", label: "Chinese Yuan", locale: "zh-CN" },
  { code: "GBP", label: "British Pound", locale: "en-GB" },
  { code: "JPY", label: "Japanese Yen", locale: "ja-JP" },
  { code: "CAD", label: "Canadian Dollar", locale: "en-CA" },
  { code: "AUD", label: "Australian Dollar", locale: "en-AU" },
  { code: "HKD", label: "Hong Kong Dollar", locale: "en-HK" },
  { code: "SGD", label: "Singapore Dollar", locale: "en-SG" },
  { code: "CHF", label: "Swiss Franc", locale: "de-CH" },
  { code: "INR", label: "Indian Rupee", locale: "en-IN" },
  { code: "MXN", label: "Mexican Peso", locale: "es-MX" },
  { code: "BRL", label: "Brazilian Real", locale: "pt-BR" },
  { code: "SEK", label: "Swedish Krona", locale: "sv-SE" },
  { code: "PLN", label: "Polish Zloty", locale: "pl-PL" },
  { code: "KRW", label: "South Korean Won", locale: "ko-KR" },
  { code: "TRY", label: "Turkish Lira", locale: "tr-TR" },
  { code: "THB", label: "Thai Baht", locale: "th-TH" },
  { code: "NOK", label: "Norwegian Krone", locale: "nb-NO" },
  { code: "MYR", label: "Malaysian Ringgit", locale: "ms-MY" },
  { code: "AED", label: "UAE Dirham", locale: "ar-AE" },
];

const CURRENCY_REFRESH_WINDOW_MS = 12 * 60 * 60 * 1000;

function roundBaseAmount(amount: number) {
  return Math.round(amount * 10000) / 10000;
}

function roundDisplayAmount(amount: number) {
  return Math.round(amount * 100) / 100;
}

function getCurrencyLocale(currencyCode: SupportedCurrency) {
  return SUPPORTED_CURRENCIES.find((currency) => currency.code === currencyCode)?.locale || "en-US";
}

export function formatCurrency(amount: number, currencyCode: SupportedCurrency = "PHP"): string {
  return new Intl.NumberFormat(getCurrencyLocale(currencyCode), {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getEffectiveExchangeRate(
  currencySettings: CurrencySettings | undefined,
  targetCurrency: SupportedCurrency,
) {
  if (!currencySettings) {
    return targetCurrency === "PHP" ? 1 : 1;
  }

  if (targetCurrency === currencySettings.baseCurrency) {
    return 1;
  }

  return (
    currencySettings.manualExchangeRates[targetCurrency] ||
    currencySettings.exchangeRates[targetCurrency] ||
    1
  );
}

export function convertFromBaseCurrency(
  amountInBaseCurrency: number,
  currencySettings: CurrencySettings | undefined,
  targetCurrency?: SupportedCurrency,
) {
  if (!currencySettings) {
    return roundDisplayAmount(amountInBaseCurrency);
  }

  const finalCurrency = targetCurrency || currencySettings.preferredCurrency || currencySettings.baseCurrency;
  return roundDisplayAmount(amountInBaseCurrency * getEffectiveExchangeRate(currencySettings, finalCurrency));
}

export function convertToBaseCurrency(amountInDisplayCurrency: number, currencySettings: CurrencySettings | undefined) {
  if (!currencySettings) {
    return roundBaseAmount(amountInDisplayCurrency);
  }

  const rate = getEffectiveExchangeRate(currencySettings, currencySettings.preferredCurrency);
  if (!rate) {
    return roundBaseAmount(amountInDisplayCurrency);
  }

  return roundBaseAmount(amountInDisplayCurrency / rate);
}

export function formatUserCurrency(amountInBaseCurrency: number, currencySettings: CurrencySettings | undefined) {
  if (!currencySettings) {
    return formatCurrency(amountInBaseCurrency);
  }

  return formatCurrency(
    convertFromBaseCurrency(amountInBaseCurrency, currencySettings),
    currencySettings.preferredCurrency,
  );
}

export function shouldRefreshCurrencyRates(currencySettings: CurrencySettings | undefined) {
  if (!currencySettings) return true;
  if (currencySettings.preferredCurrency === currencySettings.baseCurrency && !currencySettings.lastUpdated) {
    return false;
  }
  if (!currencySettings.lastUpdated) return true;

  const lastUpdated = new Date(currencySettings.lastUpdated).getTime();
  return Number.isNaN(lastUpdated) || Date.now() - lastUpdated > CURRENCY_REFRESH_WINDOW_MS;
}

export async function fetchExchangeRates(baseCurrency: SupportedCurrency) {
  const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);

  if (!response.ok) {
    throw new Error(`Exchange-rate request failed with status ${response.status}`);
  }

  const payload = await response.json();

  if (payload.result !== "success" || !payload.rates) {
    throw new Error(payload["error-type"] || "Exchange-rate API returned an invalid payload");
  }

  const filteredRates = Object.fromEntries(
    SUPPORTED_CURRENCIES.map(({ code }) => [code, payload.rates[code] || (code === baseCurrency ? 1 : undefined)]),
  ) as Partial<Record<SupportedCurrency, number>>;

  filteredRates[baseCurrency] = 1;

  return {
    exchangeRates: filteredRates,
    lastUpdated: new Date((payload.time_last_update_unix || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    provider: "ExchangeRate-API (open.er-api.com)",
  };
}

export function applyExchangeRateUpdate(
  currencySettings: CurrencySettings,
  exchangeRatePayload: Awaited<ReturnType<typeof fetchExchangeRates>>,
) {
  return {
    ...currencySettings,
    exchangeRates: {
      ...currencySettings.exchangeRates,
      ...exchangeRatePayload.exchangeRates,
    },
    lastUpdated: exchangeRatePayload.lastUpdated,
    provider: exchangeRatePayload.provider,
    source: "api" as const,
  };
}

export async function refreshUserCurrencyRatesIfNeeded(username: string) {
  const userData = getUserData(username);
  if (!userData || !shouldRefreshCurrencyRates(userData.currencySettings)) {
    return userData;
  }

  try {
    const exchangeRatePayload = await fetchExchangeRates(userData.currencySettings.baseCurrency);
    const nextUserData: UserData = {
      ...userData,
      currencySettings: applyExchangeRateUpdate(userData.currencySettings, exchangeRatePayload),
    };

    return saveUserData(username, nextUserData);
  } catch (error) {
    console.error("Unable to refresh currency rates", error);
    return userData;
  }
}

export function buildManualCurrencyOverride(
  currencySettings: CurrencySettings,
  currencyCode: SupportedCurrency,
  manualRate: number,
): CurrencySettings {
  return {
    ...currencySettings,
    manualExchangeRates: {
      ...currencySettings.manualExchangeRates,
      [currencyCode]: manualRate,
    },
    source: "manual",
    lastUpdated: new Date().toISOString(),
    provider: currencySettings.provider || "Manual fallback",
  };
}

export function clearManualCurrencyOverride(
  currencySettings: CurrencySettings,
  currencyCode: SupportedCurrency,
): CurrencySettings {
  const nextManualExchangeRates = { ...currencySettings.manualExchangeRates };
  delete nextManualExchangeRates[currencyCode];

  return {
    ...currencySettings,
    manualExchangeRates: nextManualExchangeRates,
    source: Object.keys(nextManualExchangeRates).length > 0 ? "manual" : currencySettings.provider ? "api" : "seed",
  };
}
