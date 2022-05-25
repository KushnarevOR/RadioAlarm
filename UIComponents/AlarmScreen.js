import { Button, StyleSheet, Text, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { db } from '../App.js';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

function AlarmScreen(props) {

	const [date, setDate] = useState(new Date());
	const [mode, setMode] = useState('datetime');
	const [show, setShow] = useState(false);
	const [text, setText] = useState('Empty');

	const [selectedRadio, setSelectedRadio] = useState('1');

	insertItem = (time, radio) => {
		return new Promise(() => {
			db.transaction(tx => {
				tx.executeSql('INSERT INTO alarms (time, isActive, radio) VALUES (?, ?, ?)', [time, 1, radio], (tx, results) => {
					console.log('insertion: ' + results.insertId);
				})
			});
		});
	}

	const onChange = (event, selectedDate) => {
		const currentDate = selectedDate || date;
		setShow(Platform.OS == 'ios');
		setDate(currentDate);

		let tempDate = new Date(currentDate);
		let fTime = 'Hours: ' + tempDate.getHours() + ' | Minutes: ' + tempDate.getMinutes();
		setText(fTime)
	}

	const showMode = (currentMode) => {
		setShow(true);
		setMode(currentMode);
	}
	
	return (
		<View style={{ flex: 1, flexDirection: 'column' }}>
			<Text style={{ fontWeight: 'bold', fontSize: 20 }}>{text}</Text>
			<View style={{ margin: 20 }}>
				<Button title='Pick time' onPress={() => showMode('time')} />
			</View>
			<View>
				<Picker
					selectedValue={selectedRadio}
					onValueChange={(itemValue, itemIndex) =>
						setSelectedRadio(itemValue)
					}>
					<Picker.Item label="Radio 1" value="1" />
					<Picker.Item label="Radio 2" value="2" />
					<Picker.Item label="Radio 3" value="3" />
				</Picker>
			</View>
			<View style={{ margin: 20 }}>
				<Button title='Confirm' onPress={async () => {
					insertItem(date.toUTCString(), selectedRadio).then(props.navigation.navigate('Home', ({ isChanged: true, })));
					//props.navigation.navigate('Home', ({ isChanged: true, }));
				}}/>
			</View>

			{show && (
				<DateTimePicker
					testID='dateTimePicker'
					value={date}
					mode={mode}
					is24Hour={true}
					display='default'
					onChange={onChange}
				/>)}
		</View>
	)
}

export { AlarmScreen };