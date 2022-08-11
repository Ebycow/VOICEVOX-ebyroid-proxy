import assert from 'assert';
import fetch from 'node-fetch';
import http from 'http';

import fs from "fs"

const VOICEVOX_API_PATH = "http://localhost:50021";
const VOICEVOX_OUTPUT_SAMPLING_RATE = 44100;
const VOICEVOX_OUTPUT_BIT_DEPTH = 16;

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

    audioQuery.outputSamplingRate = VOICEVOX_OUTPUT_SAMPLING_RATE;
    return audioQuery;
}

/**
 * 
 *
 * @param {AudioQuery} audioQuery
 * @param {number} speaker
 * @param {SynthesisConfig} config
 * @returns {Buffer} 
 * 
 */
async function getSynthesisAudio(audioQuery, config) {
    assert(typeof audioQuery === 'object');
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
    
    const body = new Buffer.from(await request.arrayBuffer())

    return body;

}


const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    if(request.method === "GET" && requestUrl.pathname === "/api/v1/audiostream") {

        const text = requestUrl.searchParams.get('text');

        // 要例外処理

        const synthesisConfig = { speaker : 0, enableInterrogativeUpspeak  : false };
        let audioQuery = await getAudioQuery(text, synthesisConfig);
        audioQuery = transformAudioQuery(audioQuery);

        const synthesis = await getSynthesisAudio(audioQuery, synthesisConfig);
        console.log("buffer-length:", synthesis.length);

        response.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Ebyroid-PCM-Sample-Rate' : VOICEVOX_OUTPUT_SAMPLING_RATE,
            'Ebyroid-PCM-Bit-Depth' : VOICEVOX_OUTPUT_BIT_DEPTH,
            'Ebyroid-PCM-Number-Of-Channels' : audioQuery.outputStereo ? 2 : 1
        });
        
        
        response.end(synthesis);

    } else {
        response.writeHead(400, {'Content-Type': 'text/html; charset=utf-8'});
        response.end('error');

    }
 
});

server.listen(4090, "0.0.0.0", () => {
    console.log("server listen on :4090");
})
