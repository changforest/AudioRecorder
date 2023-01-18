function upload_to_S3(AudioFile) {
	var bodyFormData = new FormData();
	bodyFormData.append('ClassroomId', 123); 
	bodyFormData.append('FileContext', AudioFile); 
	axios({
		method: 'post',
		url: '/Jitsi/UploadAudioToS3',
		data: bodyFormData,
		headers: { "Content-Type": "multipart/form-data" },
	}).then(res => {
		var data = JSON.parse(res.data);
		if (data.IsSuccess) {
			//console.log("Upload to S3 success");
		}
		else {
			//console.log("Upload to S3 fail.")
			//console.log(data.Message);
		}
	}).catch(err => {
		console.log("Upload to S3 fail.")
	});
}
//錄音檔案
const audioOptions = {mimeType: 'audio/webm'};
var recordedChunks = [];
var mediaRecorder;
var isMicRecording = false;
var fileNum = 0;
	 
//監聽音量
navigator.mediaDevices.getUserMedia({
	audio: true,
	video: false
})
.then(async function(stream) {
	const audioContext = new AudioContext();
	const analyser = audioContext.createAnalyser();
	const microphone = audioContext.createMediaStreamSource(stream);
	const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

	analyser.smoothingTimeConstant = 0.8;
	analyser.fftSize = 1024;

	microphone.connect(analyser);
	analyser.connect(scriptProcessor);
	scriptProcessor.connect(audioContext.destination);
	scriptProcessor.onaudioprocess = function() {
		const array = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(array);
		const arraySum = array.reduce((a, value) => a + value, 0);
		const average = arraySum / array.length;
		//console.log(Math.round(average));
		if (!isMicRecording){
			mediaRecorder = new MediaRecorder(stream, audioOptions);
		}
		colorPids(average);
	};
})
.catch(function(err) {
	/* handle the error */
	console.log(err);
});
//設定音量色塊顏色
function colorPids(vol) {
	const allPids = [...document.querySelectorAll('.pid')];
	const numberOfPidsToColor = Math.round(vol / 10);
	const pidsToColor = allPids.slice(0, numberOfPidsToColor);
	console.log("numberOfPidsToColor: " + numberOfPidsToColor);
	$("#mic_vol").text(vol);
	if (numberOfPidsToColor > 3 && !isMicRecording) {
		isMicRecording = true;
		recordedChunks.length = 0;
		StartMicRecord();
		$("#mic_vol").attr("style", "color: darkcyan;font-weight: bold;");
	}
	if (numberOfPidsToColor == 0 && isMicRecording) {
		isMicRecording = false;
		recordedChunks = [];
		StopMicRecord();
		$("#mic_vol").attr("style", "");
	}

	for (const pid of allPids) {
		pid.style.backgroundColor = "#e6e7e8";
	}
	for (const pid of pidsToColor) {
		// console.log(pid[i]);
		pid.style.backgroundColor = "#69ce2b";
	}
}
function StartMicRecord(){
	mediaRecorder.start();
	mediaRecorder.addEventListener('dataavailable', function(e) {
		if (e.data.size > 0) recordedChunks.push(e.data);
	});
}
function StopMicRecord(){
	mediaRecorder.stop();
	// mediaRecorder.addEventListener('stop', function() {
		// var AudioFile = new Blob(recordedChunks, { 'type': 'audio/mp3' });
		// upload_to_S3(AudioFile);
	// });
	mediaRecorder.addEventListener('stop', function() {
	  downloadLink.href = URL.createObjectURL(new Blob(recordedChunks));
	  downloadLink.download = `acetest${fileNum}.mp3`;
	});
	fileNum += 1;
}