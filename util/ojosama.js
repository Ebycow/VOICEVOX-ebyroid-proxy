import { exec } from "child_process"
import assert from 'assert';
import path from "path"

async function getOjoSpeak(text) {
    assert(text != "");
    return await new Promise((resolve, reject) => {
        exec(`${path.resolve("./bin/ojosama.exe")} -t ${ text.replace("\n", "").replace(" ", "") }`, (error, stdout, stderr) => {
            if (error) {
                throw error;
            }
            if (stderr) {
                throw stderr;
            }
            resolve(stdout);
        });
    }) 
}

export default getOjoSpeak;