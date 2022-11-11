const cloudService  = require('client-cloud-services');
const path          = require('path');
const fs            = require('fs');
const eachSeries    = require('async').eachSeries;

const config = {
  sunbird_azure_account_name: process.env.sunbird_azure_account_name,
  sunbird_azure_account_key: process.env.sunbird_azure_account_key,
  sunbird_azure_resourceBundle_container_name: process.env.sunbird_azure_resourceBundle_container_name,
  sunbird_cloud_storage_provider: process.env.sunbird_cloud_storage_provider
};

let client = cloudService.init(config.sunbird_cloud_storage_provider);
let storage = new client(config);

const jsonDirectory = path.resolve(__dirname + '../../resourcebundles/json');
uploadFilesToBlob = () => {
  fs.readdir(jsonDirectory, (err, filenames) => {
    if (err) {
      console.error('❌ upload :: Error reading directory ' + err);
    } else {
      console.group('Uploading JSON to Blob Storage');
      eachSeries(filenames, (filename, cb) => {
        const filePath = path.resolve(__dirname + '../../resourcebundles/json/' + filename);
        if (filename != '.DS_Store' && filename != '.DS_Store.json') {
          storage.upload(config.sunbird_azure_resourceBundle_container_name, filename, filePath, {}, (err, result, response) => {
            if (err) {
              console.error('❌ upload :: Error uploading file [ ' + filePath + ' ]. Error => ' + err);
              cb(err);
            } else if (result) {
              console.log({ msg: '📁 upload :: File [ ' + filePath + ' ] uploaded successfully' });
              cb();
            } else if (response) {
              cb();
            }
          });
        } else {
          cb();
        }
      }, (err) => {
        console.groupEnd();
        if (err) {
          console.error('❌ upload:: async error ' + err);
        } else {
          console.log({ msg: '✅ All files uploaded successfully' })
        }
      });
    }
  });
};

module.exports.uploadFilesToBlob = uploadFilesToBlob;
