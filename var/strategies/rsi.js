const SignalResult = require('../../src/modules/strategy/dict/signal_result');

module.exports = class DipCatcher {
  getName() {
    return 'rsi';
  }

  buildIndicator(indicatorBuilder, options) {
    indicatorBuilder.add('rsi', 'rsi', options.period);
    indicatorBuilder.add('candles', 'candles', options.period);
  }

  period(indicatorPeriod, options) {
    const currentValues = indicatorPeriod.getLatestIndicators();
    const emptySignal = SignalResult.createEmptySignal(currentValues);
    const lastSignal = indicatorPeriod.getLastSignal();
    const rsis = indicatorPeriod.getIndicator('rsi');
    const historyCandles = indicatorPeriod.getIndicator('candles');
    const profit = indicatorPeriod.getProfit();

    if (rsis && rsis.length >= options.number_of_histories_to_scan && historyCandles && historyCandles.length >= 2) {
      // const candle
      const currentRSI = rsis[rsis.length - 1];
      const prevRSI = rsis[rsis.length - 2];

      const historiesRSIToScan = rsis.slice(-options.number_of_histories_to_scan);

      const currentCandle = historyCandles[historyCandles.length - 1];
      const prevCandle = historyCandles[historyCandles.length - 2];

      // Not in any position
      if (!lastSignal) {
        // Found the second bottom
        if (prevRSI < options.low_rsi - options.delta_rsi && currentRSI > prevRSI) {
          let indexOfFirstBottom = options.number_of_histories_to_scan - 3;
          // Seed the current index to above the low rsi;
          while (indexOfFirstBottom >= 1) {
            if (historiesRSIToScan[indexOfFirstBottom] > options.low_rsi + options.delta_rsi) {
              break;
            }
            indexOfFirstBottom -= 1;
          }

          // Will find the first bottom
          for (; indexOfFirstBottom >= 1; indexOfFirstBottom -= 1) {
            if (
              historiesRSIToScan[indexOfFirstBottom - 1] > historiesRSIToScan[indexOfFirstBottom] &&
              historiesRSIToScan[indexOfFirstBottom] < options.low_rsi - options.delta_rsi &&
              historiesRSIToScan[indexOfFirstBottom + 1] > historiesRSIToScan[indexOfFirstBottom]
            ) {
              break;
            }
          }

          // Found the first bottom;
          // And the first bottom must be less than the second bottom
          if (indexOfFirstBottom >= 1 && historiesRSIToScan[indexOfFirstBottom] < prevRSI - options.delta_rsi) {
            emptySignal.setSignal('short');
          }
        }
      }

      // In long position
      if (lastSignal === 'short') {
        if (profit > options.tp_percent || currentRSI > options.tp_rsi) {
          emptySignal.setSignal('close');
        }
      }
    }

    return emptySignal;
  }

  getBacktestColumns() {
    return [
      {
        label: 'rsi',
        value: row => {
          return row.rsi;
        },
        type: 'message'
      }
    ];
  }

  getOptions() {
    return {
      period: '15m',
      tp_percent: 5,
      sl_percent: 5,
      low_rsi: 30,
      delta_rsi: 1,
      tp_rsi: 50,
      number_of_histories_to_scan: 16
    };
  }
};
