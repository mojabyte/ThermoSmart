export const SMS_TYPES_REGEX = {
  GET_STATUS: /^ دما [\s\S]*$/,
  GET_TEMPERATURE: /^ساعت \S* مقدار {2}دما [\s\S]*$/,
  GET_THERMOSTAT_VALUES: /^مقادير ترموستات[\s\S]*$/,
  UPDATE_THERMOSTAT_MAX: /^مقدار ماكزيمم به[\s\S]*$/,
  UPDATE_THERMOSTAT_NOR: /^مقدار نرمال به[\s\S]*$/,
  UPDATE_THERMOSTAT_MIN: /^مقدار مينيمم به[\s\S]*$/,
  GET_ALARM_VALUES_HIGH: /^مقادير هشدار ماكزيمم[\s\S]*$/,
  UPDATE_ALARM_HIGH: /^مقدار ماكزيمم هشدار تغيير[\s\S]*$/,
  GET_ALARM_VALUES_LOW: /^مقادير هشدار مينيمم[\s\S]*$/,
  UPDATE_ALARM_LOW: /^مقدار مينيمم هشدار تغيير[\s\S]*$/,
  GET_ALARM_VALUES_INTERVAL: /^زمان ارسال پيامك هشدار بعدي : *(\d+) دقيقه$/,
  UPDATE_ALARM_INTERVAL: /^زمان ارسال پيامك هشدار بعدي به *(\d+) دقيقه تغيير كرد$/,
  GET_REPORT_INTERVAL: /^زمان ارسال دوره اي گزارش:\n *(\d+) *دقيقه$/,
  UPDATE_REPORT_INTERVAL: /^زمان ارسال دوره اي گزارش به *(\d+) *دقيقه تغيير كرد$/,
  GET_CLOCK: /^ساعت سيستم (\S{2}):(\S{2})$/,
  UPDATE_CLOCK: /^ساعت سيستم به (\S{2}):(\S{2}) تغيير كرد$/,
  GET_SIM_CHARGE: /^اعتبار شما\n *([۰-۹]*)ريال$/,
  GET_SIGNAL_STRENGTH: /^ميزان آنتن دهي\n%(\d+) *$/,
  GET_PHONE_NUMBERS: /^شماره تلفن هاي موجود:[\s\S]*$/,
  UPDATE_PHONE_NUMBER: /^شماره (\d+) در حافظه ثبت شد$/,
  DELETE_PHONE_NUMBER: /^شماره (\d+) از حافظه حذف شد$/,
  UPDATE_PASSWORD: /^رمز دستگاه {2}به (\d+) تغيير كرد$/,
  GET_SIM_CREDIT_SMS_INTERVAL: /^تعداد روز ارسال دوره اي شارژ سيمكارت: *(\d+) روز$/,
  UPDATE_SIM_CREDIT_SMS_INTERVAL: /^تعداد روز ارسال دوره اي شارژ سيمكارت به *(\d+) روز تغيير كرد$/,
  GET_POWER_OUTAGE_SMS_INTERVAL: /^زمان ارسال پيامك هشدار قطع برق : *(\d+) دقيقه$/,
  UPDATE_POWER_OUTAGE_SMS_INTERVAL: /^زمان ارسال پيامك هشدار برق {2}به  *(\d+) دقيقه تغيير كرد$/,
  GET_CALIBRATION: /^كاليبره سنسور\D*(?:در حالت كارخانه اي|([+-]?\d+(?:\.\d+)?).*(افزايش|كاهش) يافته) است$/,
  UPDATE_CALIBRATION: /^كاليبره سنسور *([+-]?\d+(?:\.\d+)?) *درجه سانتيگراد (كاهش|افزايش) يافت$/,
  RESET_CALIBRATION: /^كاليبره سنسور به حالت كارخانه اي بازگشت$/,
  UPDATE_THERMOSTAT_STATUS: /^حالت .* به (دستي|اتوماتيك) تغيير كرد$/,
  UPDATE_HEATER_STATUS: /^هيتر (روشن|خاموش) شد$/,
  UPDATE_FAN_STATUS: /^هواكش (روشن|خاموش) شد$/,
  UPDATE_POWER_STATUS: /^برق (قطع|وصل) شد\n(\S*)$/,
  ALARM: /^ميزان {2}دما {2}(?:بيشتر|كمتر) از (?:ماكزيمم|مينيمم) شد\n<*(\d+(?:\.\d+)?)C>$/, // TODO: Needs revision

  OTHER: /.*/,
}

export type StringKeys<objType extends {}> = Array<Extract<keyof objType, string>>

export const SMS_TYPES = Object.keys(SMS_TYPES_REGEX) as StringKeys<typeof SMS_TYPES_REGEX>

// Get type of received SMS from it's body
export const getSmsType = (body: string, types = SMS_TYPES): typeof SMS_TYPES[number] => {
  if (["*", "#"].includes(body[0])) return "OTHER"

  for (const type of types) {
    if (RegExp(SMS_TYPES_REGEX[type]).test(body)) return type
  }
  return "OTHER"
}
