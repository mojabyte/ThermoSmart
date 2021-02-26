package com.thermosmart;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.PowerManager;
import android.view.View;
import android.view.View.OnTouchListener;
import android.view.MotionEvent;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import android.media.MediaPlayer;
import android.media.AudioManager;
import android.media.RingtoneManager;
import android.net.Uri;
import android.content.pm.PackageManager;

import java.io.IOException;

public class AlarmActivity extends Activity {
  private MediaPlayer mMediaPlayer;

  private PowerManager.WakeLock wl;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
    wl = pm.newWakeLock(PowerManager.FULL_WAKE_LOCK, "My Tag");
    wl.acquire();

    this.requestWindowFeature(Window.FEATURE_NO_TITLE);
    this.getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN |
      WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
      WindowManager.LayoutParams.FLAG_FULLSCREEN |
      WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
    setContentView(R.layout.alarm);

    String title = getIntent().getStringExtra("TITLE");
    String details = getIntent().getStringExtra("DETAILS");

    TextView titleTextView = (TextView) findViewById(R.id.title);
    titleTextView.setTextSize(40);
    titleTextView.setText(title);

    TextView detailsTextView = (TextView) findViewById(R.id.details);
    detailsTextView.setTextSize(32);
    detailsTextView.setText(details);

    Button stopAlarm = (Button) findViewById(R.id.stopAlarm);
    stopAlarm.setOnTouchListener(new OnTouchListener() {
      public boolean onTouch(View v, MotionEvent arg1) {
        mMediaPlayer.stop();
        startMainActivity(v.getContext());
        finish();
        return false;
      }
    });

    playSound(this, getAlarmUri());
  }

  private void playSound(Context context, Uri alert) {
    mMediaPlayer = new MediaPlayer();
    try {
      mMediaPlayer.setDataSource(context, alert);
      final AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
      if (audioManager.getStreamVolume(AudioManager.STREAM_ALARM) != 0) {
        mMediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
        mMediaPlayer.prepare();
        mMediaPlayer.start();
      }
    } catch (IOException e) {
      System.out.println("OOPS");
    }
  }

  //Get an alarm sound. Try for an alarm. If none set, try notification,
  //Otherwise, ringtone.
  private Uri getAlarmUri() {
    Uri alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
    if (alert == null) {
      alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
      if (alert == null) {
        alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
      }
    }
    return alert;
  }

  private void startMainActivity(Context context) {
    PackageManager pm = context.getPackageManager();
    Intent intent = pm.getLaunchIntentForPackage(context.getPackageName());
    context.startActivity(intent);
  }

  protected void onStop() {
    super.onStop();
    wl.release();
  }
}
