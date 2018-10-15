'use strict';
import { ipcRenderer } from 'electron';
import { scanPDFFile } from "../pdfscan";
import { findOutOfDateFiles } from '../dirscan';
import ProgressBar from 'electron-progressbar';

window.onload = function () {

  console.log("background window started");
	ipcRenderer.on('bgmessage', function(event, message) {
    console.log("message received: ", message.type);
    switch (message.type) {
      case "scanFiles":
        scan(message);
        break;
      case "findOutOfDateFiles":
        findOutOfDate(message);
        break;
    }
  });

}

function findOutOfDate(message) {

  findOutOfDateFiles(message.dirs, function (doc) {
    ipcRenderer.send('fgmessage', {
      type: "fileIsOutOfDate",
      absolute: doc.absolute,
      doc: doc
    });

  }).then(function (allDocs) {
    ipcRenderer.send('fgmessage', {
      type: "outOfDateScanComplete",
      payload: allDocs
    })
  });
}

function scan(message) {

  var bar = createProgressBar({
    initialValue: 0,
    maxValue: message.files.length,
  });

  message.files.forEach( (absolute) => {
    console.log("Scanning: ", absolute);
    scanPDFFile(absolute)
      .then( (hashtags) => {
        // ipcRenderer.send('fgmessage', {
        //   type: "scanComplete",
        //   absolute: absolute,
        //   hashtags: hashtags
        // });
        updateProgressBar(bar);
      })
      .catch( (errors) => {
        ipcRenderer.send('fgmessage', {
          type: "scanFailed",
          absolute: absolute,
          errors: errors
        });
      });
  });
}
