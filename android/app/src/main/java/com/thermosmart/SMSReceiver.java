package com.thermosmart;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.widget.Toast;

import com.facebook.react.HeadlessJsTaskService;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.provider.Settings;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import java.util.regex.Pattern;

public class SMSReceiver extends BroadcastReceiver {

  @Override
  public void onReceive(Context context, Intent intent) {
    Bundle myBundle = intent.getExtras();
    SmsMessage [] messages = null;

    if (myBundle != null) {
      Object [] pdus = (Object[]) myBundle.get("pdus");
      messages = new SmsMessage[pdus.length];

      String alarmTitle = null;
      String alarmDetails = null;

      SharedPreferences settings = context.getSharedPreferences("preferences", Context.MODE_PRIVATE);
      String alarmsString = settings.getString("alarms", null);
      String devicesString = settings.getString("devices", null);

      for (int i = 0; i < messages.length; i++) {
        messages[i] = SmsMessage.createFromPdu((byte[]) pdus[i]);
        String originatingAddress = messages[i].getOriginatingAddress();

        // TODO: check if message body is alarm by regex

        String message = messages[i].getMessageBody();

        if (Pattern.matches("(?m)ميزان  دما  (بيشتر|کمتر) از (ماكزيمم|مينيمم) شد(\\W)*(\\S)*", message)) {
          try {
            // TODO: get alarm preferences
            JSONArray devices = new JSONArray(devicesString);
            for (int j = 0; j < devices.length(); j++) {
              JSONObject device = devices.getJSONObject(j);
              String simNumber = device.getString("value");
              if (simNumber.equals(originatingAddress)) {
                alarmTitle = device.getString("label");
                String details = device.getString("details");
                if (details != null && !details.trim().isEmpty()) {
                  alarmTitle += " (" + details + ")";
                }
                alarmDetails = message;
                break;
              }
            }
          } catch (JSONException e) {
              e.printStackTrace();
          }

        }
      }

      if (alarmTitle != null) {
        Intent wakeIntent = new Intent(context.getApplicationContext(), AlarmActivity.class);
        wakeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        wakeIntent.putExtra("TITLE", alarmTitle);
        wakeIntent.putExtra("DETAILS", alarmDetails);

        PendingIntent pendingIntent = PendingIntent.getActivity(context.getApplicationContext(),
            12345, wakeIntent, PendingIntent.FLAG_CANCEL_CURRENT);
        AlarmManager am = (AlarmManager)context.getSystemService(Activity.ALARM_SERVICE);
        am.set(AlarmManager.RTC_WAKEUP, 1000, pendingIntent);
      }
    }
    HeadlessJsTaskService.acquireWakeLockNow(context);
  }
}
