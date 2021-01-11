package com.thermosmart;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Build;
import android.telephony.SmsMessage;
import android.widget.Toast;

import com.facebook.react.HeadlessJsTaskService;

import android.app.Notification;
import android.app.NotificationManager;
import androidx.core.app.NotificationCompat;
import android.app.PendingIntent;
import android.content.res.Resources;
import android.media.MediaPlayer;
import android.media.AudioManager;
import android.provider.Settings;
import android.util.Log;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

public class SMSReceiver extends BroadcastReceiver {

  @Override
  public void onReceive(Context context, Intent intent) {
    Bundle myBundle = intent.getExtras();
    SmsMessage [] messages = null;
    String strMessage = "";

    if (myBundle != null) {
      Object [] pdus = (Object[]) myBundle.get("pdus");
      messages = new SmsMessage[pdus.length];

      for (int i = 0; i < messages.length; i++) {
        messages[i] = SmsMessage.createFromPdu((byte[]) pdus[i]);
        strMessage += "SMS From: " + messages[i].getOriginatingAddress();
        strMessage += " : ";
        strMessage += messages[i].getMessageBody();
        strMessage += "\n";
      }

      SharedPreferences settings = context.getSharedPreferences("preferences", context.MODE_PRIVATE);
      String alarmsString = settings.getString("alarms", null);

      try {
        JSONArray alarms = new JSONArray(alarmsString);
        JSONObject firstAlarm = alarms.getJSONObject(0);
        strMessage += firstAlarm.getString("name");
      } catch (JSONException e) {
          e.printStackTrace();
      }

      Toast.makeText(context, strMessage, Toast.LENGTH_SHORT).show();

      PendingIntent contentIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);

      NotificationCompat.Builder notification = new NotificationCompat.Builder(context);

      // Small icon
      int smallIconResId = 0;

      Resources res = context.getResources();
      String packageName = context.getPackageName();

      smallIconResId = res.getIdentifier("ic_notification", "mipmap", packageName);

      if (smallIconResId == 0) {
        smallIconResId = res.getIdentifier("ic_launcher", "mipmap", packageName);
      }

      notification
        .setAutoCancel(true)
        .setDefaults(Notification.DEFAULT_ALL)
        .setWhen(System.currentTimeMillis())
        .setSmallIcon(smallIconResId)
        .setTicker("Hearty365")
        .setContentTitle("Default notification")
        .setContentText(strMessage)
        .setDefaults(Notification.DEFAULT_LIGHTS)
        .setSound(Settings.System.DEFAULT_ALARM_ALERT_URI)
        .setContentIntent(contentIntent)
        .setContentInfo("Info");

      // int notificationID = 100;

      // Intent actionIntent = new Intent(context, RNPushNotificationActions.class);
      // actionIntent.setAction(packageName + ".ACTION_" + i);

      // actionIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);

      // // Add "action" for later identifying which button gets pressed.
      // bundle.putString("action", action);
      // actionIntent.putExtra("notification", bundle);
      // actionIntent.setPackage(packageName);
      // if (messageId != null) {
      //   intent.putExtra("message_id", messageId);
      // }


      // PendingIntent pendingActionIntent = PendingIntent.getBroadcast(context, notificationID, actionIntent,
      // PendingIntent.FLAG_UPDATE_CURRENT);

      // int icon = 0;
      // String action = "OK";

      // if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      //   notification.addAction(new NotificationCompat.Action.Builder(icon, action, pendingActionIntent).build());
      // } else {
      //   notification.addAction(icon, action, pendingActionIntent);
      // }

      AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
      int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
      audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, 0);

      MediaPlayer player = MediaPlayer.create(context, Settings.System.DEFAULT_ALARM_ALERT_URI);
      player.setVolume(1.0f, 1.0f);
      player.start();

      NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
      notificationManager.notify(1, notification.build());
    }
    HeadlessJsTaskService.acquireWakeLockNow(context);
  }
}
