import { Button, FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AlarmScreen } from './';
import React, { Component } from 'react';
import Moment from 'moment';
import notifee from '@notifee/react-native';
import { setAlarm, stopAlarm, onCreateTriggerNotification } from './UIComponents/Notifications.js';

const Stack = createNativeStackNavigator();

var SQLite = require('react-native-sqlite-storage')
var db = SQLite.openDatabase({ name: 'alarms.db', createFromLocation: '~alarms.db' })

notifee.onForegroundEvent(async ({ type, detail }) => {
    setAlarm(type, detail);
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
    setAlarm(type, detail);
});

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Alarm Settings" component={AlarmScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const deleteItem = (id) => {
    db.transaction(tx => {
        tx.executeSql('DELETE FROM alarms WHERE id = ?', [id], () => {})
    });
};

const updateItem = (id, isActive) => {
    db.transaction(tx => {
        tx.executeSql('UPDATE alarms SET isActive = ? WHERE id = ?', [isActive, id], () => { })
    });
};


class HomeScreen extends Component {

    state = {
        data: [],
        isChanged: false,
        lastInsertID: 0,
    }

    componentDidMount = async () => {
        console.log('componentDidMount');
        await this.selectItems();
    }

    componentDidUpdate = async () => {
        if (this.props.route.params) {
            if (this.props.route.params.isChanged) {
                this.props.route.params.isChanged = false;
                this.state.isChanged = true;

                await this.getLastItem();
            }
        }

        if (this.state.isChanged) {
            console.log('Selecting alarms');
            await this.selectItems();
        }
    }

    getLastItem() {
        return new Promise(() => {
            db.transaction(tx => {
                tx.executeSql('SELECT last_insert_rowid() FROM alarms', [], async(tx, results) => {
                    console.log('getting last item: ' + results.rows.item(0)['last_insert_rowid()']);
                    this.state.lastInsertID = Number(results.rows.item(0)['last_insert_rowid()']);
                    let res = await this.selectItemByID(this.state.lastInsertID);
                    let test_time = new Date(res.time);
                    console.log('Returned id: ' + res.id + ' |  Returned hours: ' + test_time.getHours() + ' |  Returned minutes: ' + test_time.getMinutes());
                    await onCreateTriggerNotification(res.id, res.time, res.radio);
                    this.setState(this.state);
                });
            });
        });
    };

    selectItemByID(id) {
        return new Promise((resolve, reject) => {
            db.transaction(tx => {
                tx.executeSql('SELECT * FROM alarms WHERE id = ?', [id], (tx, results) => {
                    console.log('selecting by id: ' + id);
                    item = results.rows.item(0);
                    //console.log('Selected item: ' + item.id + " " + item.time);
                    //this.setState(this.state);
                    resolve(item);
                });
            });
        });
    };

    selectItems() {
        return new Promise(() => {
            db.transaction(tx => {
                tx.executeSql('SELECT * FROM alarms', [], (tx, results) => {
                    var len = results.rows.length;
                    this.state.data = [];
                    for (let i = 0; i < len; i++) {
                        let item = results.rows.item(i);
                        this.state.data.push({ id: item.id, time: item.time, isActive: item.isActive, radio: item.radio });
                    }
                    this.state.isChanged = false;
                    this.setState(this.state);
                });
            });
        });
    }

    renderItem = ({ item }) => {
        return (
            <View style={styles.item}>
                <Text>{Moment(item.time).format('HH:mm')}</Text>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', marginStart: 30 }}>
                    <Button title='Delete' onPress={async () => {
                        console.log('Deleting item');
                        deleteItem(item.id);
                        stopAlarm();
                        await notifee.cancelNotification(String(item.id));
                        this.state.isChanged = true;
                        this.setState(this.state);
                    }} />
                    <Switch
                        value={Boolean(item.isActive)}
                        onValueChange={(value) => {
                            if (value) {
                                onCreateTriggerNotification(item.id, item.time, item.radio);
                            }
                            else {
                                stopAlarm();
                                notifee.cancelNotification(String(item.id));
                            }

                            console.log('onValueChange');
                            updateItem(item.id, value ? 1 : 0);
                            this.state.isChanged = true;
                            this.setState(this.state);
                        }}
                    />
                </View>
            </View>
        );
    }

    render() {
        return (
            <View style={styles.container}>
                <FlatList
                    data={this.state.data}
                    renderItem={this.renderItem}
                    keyExtractor={item => item.id}
                />
                <Button title='Add alarm' onPress={
                    () => {
                        this.props.navigation.navigate('Alarm Settings')
                    }
                } />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        flexDirection: 'column'
    },
    item: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 5,
        marginVertical: 4,
        marginHorizontal: 14,
    }
});

export { db };