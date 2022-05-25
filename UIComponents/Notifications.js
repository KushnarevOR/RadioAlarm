import notifee, { RepeatFrequency, TriggerType, AndroidImportance, AndroidVisibility, EventType } from '@notifee/react-native';
import Moment from 'moment';
import { Audio } from 'expo-av';

Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
});

const playbackInstance = new Audio.Sound();

async function setAlarm(type, detail) {

    const sources = {
        '1': 'http://jazzradio.ice.infomaniak.ch/jazzradio-high.mp3',
        '2': 'http://sc-classrock.1.fm:8200',
        '3': 'http://chanson.hostingradio.ru:8041/chanson-romantic128.mp3',
    };

    const { notification, pressAction } = detail;

    if (type === EventType.DELIVERED) {
        console.log(notification.data.radio);
        const source = {
            uri: sources[notification.data.radio],
        };

        try {
            await playbackInstance.loadAsync(source);
            await playbackInstance.playAsync();
        } catch (err) {
            console.log(err);
        }
    }
}

async function stopAlarm() {
    try {
        await playbackInstance.stopAsync();
        await playbackInstance.unloadAsync();
    } catch (err) {
        console.log(err);
    }
}

async function onCreateTriggerNotification(alarm_id, alarm_time, alarm_radio) {
    let date = new Date(alarm_time);
    date.setSeconds(0);

    if (date.getTime() < new Date(Date.now()).getTime()) {
        date = new Date(Moment(date).add(1, 'day'));
    }

    console.log(date.getFullYear() + " " + date.getMonth() + " " + date.getDate() + " " + date.getHours() + " " + date.getMinutes() + " " + date.getSeconds());

    const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
    };

    const channelID = await notifee.createChannel({
        id: 'ChannelID',
        name: 'Default important',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        NotificationManager: AndroidImportance.HIGH,
    });

    try {
        await notifee.createTriggerNotification(
            {
                id: String(alarm_id),
                title: 'ATTENTION!',
                body: "It's time to wake up",
                data: { radio: alarm_radio },
                badge: true,
                showTimeStamp: true,
                android: {
                    channelId: channelID,
                    importance: AndroidImportance.HIGH,
                    visibility: AndroidVisibility.PUBLIC,
                    NotificationManager: AndroidImportance.HIGH,
                    fullScreenAction: {
                        id: 'default',
                    },
                    pressAction: {
                        id: 'default',
                        launchActivity: 'default',
                    },
                    actions: [
                        {
                            title: 'Open',
                            pressAction: {
                                id: 'open',
                                launchActivity: 'default',
                            }
                        }
                    ],
                },
            },
            trigger,
        );
    } catch (err) {
        console.log(err);
    }
}

export { setAlarm, stopAlarm, onCreateTriggerNotification };