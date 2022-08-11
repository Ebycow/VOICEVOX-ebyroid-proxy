import assert from 'assert'
import fetch from 'node-fetch';

const VOICEVOX_API_PATH = "http://localhost:50021";

/**
 * VoiceVoxのAudioQuery
 * @typedef {{
 *  outputSamplingRate : number
 *  outputStereo : bool
 *  kana : string
 * }} AudioQuery
 */

/**
 * VoiceVox音声合成設定の包括的なプロパティ
 * @typedef {{
 *  speaker : number
 *  enableInterrogativeUpspeak : bool
 * }} SynthesisConfig
 */

/**
 * VoiceVoxのAPIからAudioQueryを取得
 *
 * @param {string} text
 * @param {SynthesisConfig} config
 * @returns {AudioQuery} 
 */
async function getAudioQuery(text, config){
    assert(typeof config === 'object');
    assert(typeof config.speaker === 'number');

    const url = new URL(`${ VOICEVOX_API_PATH }/audio_query`);
    url.searchParams.append('text', text);
    url.searchParams.append('speaker', config.speaker);

    const request = await fetch(url.toString(), { method : "POST" });
    const audioQuery = await request.json();

    return audioQuery;

}

/**
 * VoiceVoxのAudioQuery設定を変換
 *
 * @param {AudioQuery} audioQuery
 * @returns {AudioQuery} 
 */
function transformAudioQuery(audioQuery) {
    assert(typeof audioQuery === 'object');

    audioQuery.outputSamplingRate = 44100;
    return audioQuery;
}

/**
 * VoiceVoxのAudioQuery設定を変換
 *
 * @param {AudioQuery} audioQuery
 * @param {number} speaker
 * @param {SynthesisConfig} config
 */
async function getSynthesisAudio(audio_query, config) {
    assert(typeof audio_query === 'object');
    assert(typeof config.speaker === 'number');
    assert(typeof config.enableInterrogativeUpspeak === 'boolean');

    const url = new URL(`${ VOICEVOX_API_PATH }/synthesis`);
    url.searchParams.append('speaker', config.speaker);
    url.searchParams.append('enable_interrogative_upspeak', config.enableInterrogativeUpspeak);

    const request = await fetch(url.toString(), { 
        method : "POST",
        headers : {
            "Content-Type" : "application/json",
            "Accept" : "audio/wav"
        },
        body : JSON.stringify(audioQuery)
    });
    const body = await request.text()
    return body;

}

const synthesisConfig = { speaker : 3, enableInterrogativeUpspeak  : false };
let audioQuery = await getAudioQuery("こんにちは", synthesisConfig);
audioQuery = transformAudioQuery(audioQuery);
console.log(audioQuery)

const synthesis = await getSynthesisAudio(audioQuery, synthesisConfig);
console.log(synthesis);

