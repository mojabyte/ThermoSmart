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
import android.provider.Settings.Secure;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import java.util.HashMap;
import java.util.Map;
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
      String alarmString = settings.getString("alarm", null);
      String devicesString = settings.getString("devices", null);

      try {
        JSONObject alarm = new JSONObject(alarmString);
        if (!alarm.getBoolean("isEnabled")) {
          return;
        }
      } catch (JSONException e) {
        e.printStackTrace();
      }

      for (int i = 0; i < messages.length; i++) {
        messages[i] = SmsMessage.createFromPdu((byte[]) pdus[i]);
        String originatingAddress = messages[i].getOriginatingAddress();
        String message = messages[i].getMessageBody();

        // TODO: Register userId with other properties in backend
        String userId = Secure.getString(context.getContentResolver(), Secure.ANDROID_ID);

        // TODO: store data in shared preferences in case of no internet connection
        // Send SMS data to backend
        apiCall(context, userId, originatingAddress, message);

        if (Pattern.matches("(?m)ميزان  دما  (بيشتر|كمتر) از (ماكزيمم|مينيمم) شد(\\W)*(\\S)*", message)) {
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

  public void apiCall(Context context, String userId, String address, String body) {
    RequestQueue queue = Volley.newRequestQueue(context);
    Map<String, String> params = new HashMap<>();
    params.put("userId", userId);
    params.put("address", address);
    params.put("body", body);
    JSONObject data = new JSONObject(params);

    JsonObjectRequest jsonObjectRequest = new JsonObjectRequest(
      Request.Method.POST,
      "https://api.backendless.com/10631C7B-F55C-6369-FF2C-95582BA50300/E16492A3-0A6A-499E-BB3C-A6C78E38279C/data/sms",
      data,
      new Response.Listener<JSONObject>() {
        @Override
        public void onResponse(JSONObject response) {
          // Log.d("EXAMPLE", "Register Response: " + response.toString());
        }
      },
      new Response.ErrorListener() {
        @Override
        public void onErrorResponse(VolleyError error) {
          error.printStackTrace();
        }
      }) {

      @Override
      public String getBodyContentType() {
        return "application/json; charset=utf-8";
      }
    };

    queue.add(jsonObjectRequest);
    queue.start();
  }
}
