import assert from 'assert';
import log4js from "log4js";
import fetch from 'node-fetch';
import http from 'http';
import getOjoSpeak from "./util/ojosama.js";
import translate from "./util/hiragana.js";

log4js.configure('./log4js-config.json');
const logger = log4js.getLogger();

const VOICEVOX_API_PATH = "http://localhost:50021";
const VOICEVOX_OUTPUT_SAMPLING_RATE = 44100;
const VOICEVOX_OUTPUT_BIT_DEPTH = 16;
const VOICEVOX_VOLUME = 2;

const EBYROID_API_PATH = "http://localhost:4090"

const OJO_MODE = false
const NANNARA_MODE = false

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
 * @param {string} name
 * @returns {AudioQuery} 
 */
function transformAudioQuery(audioQuery, name) {
    assert(typeof audioQuery === 'object');

    audioQuery.outputSamplingRate = VOICEVOX_OUTPUT_SAMPLING_RATE;
    audioQuery.volumeScale = VOICEVOX_VOLUME;
    if(name.split("/")[1]){
        
        audioQuery.speedScale = name.split("/")[1];
    }
    
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
    
    const arrayBuffer = await request.arrayBuffer();
    const buffer = new Buffer.from(arrayBuffer);

    // wavヘッダーを削除
    for (let i = 0; i <= 44; i++) {
        buffer[i] =  0 
        
    }

    return buffer;

}

async function transformText(text, name){
    if(name){
        text = translate(text);
        logger.trace("hiragana-transform:", text)
    }

    if(OJO_MODE){
        text = await getOjoSpeak(text);
        logger.trace("ojo-transform:", text)
    }

    if(NANNARA_MODE){
        text = "なんなら" + text;
        logger.trace("nannara-transform:", text)
    }

    logger.trace("transformed-text:", text)

    return text;

}

const server = http.createServer(async (request, response) => {
    logger.trace("request :", decodeURI(request.url));

    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    
    if(request.method === "GET" && requestUrl.pathname === "/api/v1/audiostream") {

        let text = requestUrl.searchParams.get('text');
        const name = requestUrl.searchParams.get('name');

        text = await transformText(text, name)

        if(name) {
            // 要例外処理
            logger.trace("route-voicevox:", "name=" , name);
            const synthesisConfig = { speaker : Number(name.split("/")[0]) ? Number(name.split("/")[0]) : 0, enableInterrogativeUpspeak  : true };

            try {
                let audioQuery = await getAudioQuery(text, synthesisConfig);
                audioQuery = transformAudioQuery(audioQuery, name);
        
                const synthesisBuffer = await getSynthesisAudio(audioQuery, synthesisConfig);
                logger.trace("response-buffer-length:", synthesisBuffer.length);
        
                const header = {
                    'Content-Type': 'application/octet-stream',
                    'Ebyroid-PCM-Sample-Rate' : VOICEVOX_OUTPUT_SAMPLING_RATE,
                    'Ebyroid-PCM-Bit-Depth' : VOICEVOX_OUTPUT_BIT_DEPTH,
                    'Ebyroid-PCM-Number-Of-Channels' : audioQuery.outputStereo ? 2 : 1
                };
        
                response.writeHead(200, header);
                response.end(synthesisBuffer);

            } catch (error) {
                logger.error(error);
                response.writeHead(500);
                response.end("{'error' : 'error'}");

            }

            


        } else { // default
            logger.trace("route-ebyroid:", "name=" , name);
            const url = new URL(`${ EBYROID_API_PATH }/api/v1/audiostream`);
            url.searchParams.append('text', text);
            // url.searchParams.append('name', name ); 後でこれがいる

            try {
                const req = await fetch(url.toString(), { method : "GET" });
                
                const arrayBuffer = await req.arrayBuffer();
                const buffer = new Buffer.from(arrayBuffer);
                logger.trace("response-buffer-length:", buffer.length);

                if(req.status == 200){
                    const header = {
                        'Content-Type': 'application/octet-stream',
                        'Ebyroid-PCM-Sample-Rate' : 22050,
                        'Ebyroid-PCM-Bit-Depth' : 16,
                        'Ebyroid-PCM-Number-Of-Channels' : 1
                    };

                    response.writeHead(200, header);
                    response.end(buffer);

                } else {
                    response.writeHead(400, {'Content-Type': 'text/html; charset=utf-8'});
                    response.end('error');

                }
            } catch(error) {
                logger.error(error);
                response.writeHead(500);
                response.end("{'error' : 'error'}");

            }

        }

    } else {
        response.writeHead(400, {'Content-Type': 'text/html; charset=utf-8'});
        response.end('error');

    }
 
});

server.listen(4091, "0.0.0.0", () => {
    logger.trace(`VOICEBOX-EBYROID-PROXY: Server listen on ${ server.address().port }`);
})
