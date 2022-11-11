'use strict';

const path          = require('path');
const fs            = require('fs');
const properties    = require('properties');
const _             = require('lodash');
const args          = process.argv.slice(2);
const exec          = require('child_process').exec;

// PhraseApp Configuration
const authToken     = _.get(process.env, 'PHRASE_APP.phrase_authToken');
const project       = _.get(process.env, 'PHRASE_APP.phrase_project');
const locale        = _.get(process.env, 'PHRASE_APP.phrase_locale');
const fileformat    = _.get(process.env, 'PHRASE_APP.phrase_fileformat');
const merge         = true;

const upload        = require('./upload');

const rbPatah       = path.join(__dirname, '/./../../node_modules/sunbird-localization/index.js');
const resBundlesArr = [
  {
    name: 'consumption',
    path: path.join(__dirname, '/./../resourcebundles/data/consumption/'),
    dest: path.join(__dirname, '/./../resourcebundles/json/')
  },
  {
    name: 'creation',
    path: path.join(__dirname, '/./../resourcebundles/data/creation/'),
    dest: path.join(__dirname, '/./../resourcebundles/json/')
  }
];

const buildResources = () => {
  let promises = [];
  resBundlesArr.forEach((item) => {
    promises.push(buildBundle(item));
  });
  Promise.all(promises).then(
    (res) => {
      console.log({msg: '✅ All bundles built successfully'});
      upload.uploadFilesToBlob();
    },
    (error) => {
      console.error('❌ buildResources :: Error in building resource bundles', error);
      throw new Error(error);
    }
  );
};

const buildBundle = (item) => {
  return new Promise((resolve, reject) => {
    readFiles(item.path).then(
      (allContents) => {
        let resObj = {};
        const options = {
          sections: true,
          comments: '#', // Some INI files also consider # as a comment, if so, add it, comments: [';', '#']
          separators: '=',
          strict: true,
          namespaces: true
          // path: true
        };
        allContents.forEach((contentObj) => {
          const obj = properties.parse(contentObj.content, options);
          resObj[contentObj.name] = obj;
        });
        _.forEach(resObj, (langObj, langKey) => {
          if (
            resObj[process.env.sunbird_primary_bundle_language] &&
            langKey !== process.env.sunbird_primary_bundle_language
          ) {
            fillObject(
              resObj[process.env.sunbird_primary_bundle_language],
              resObj[langKey]
            );
          }
        });
        _.forEach(resObj, (data, lang) => {
          try {
            let json = JSON.parse(fs.readFileSync(item.dest + lang + '.json'));
            json[item.name] = data;
            fs.writeFileSync(item.dest + lang + '.json', JSON.stringify(json));
            console.log({ msg: '⏳ buildBundle :: Updating resource bundles for language ' + lang });
          } catch (e) {
            console.error('❌ buildBundle :: Error in writing to JSON file for [ ' + item.dest + lang + '.json' + ' ]', e);
            if (!fs.existsSync(item.dest)) {
              fs.mkdirSync(item.dest);
            }
            fs.writeFileSync(
              item.dest + lang + '.json',
              JSON.stringify({ [item.name]: data })
            );
          }
        });
        resolve(true);
      },
      (error) => {
        console.error('❌ buildBundle :: Error while reading files: ', error);
        reject(error);
      }
    );
  });
};

const readFiles = (dirname) => {
  const readDirPr = new Promise((resolve, reject) => {
    fs.readdir(dirname, (err, filenames) => {
      err ? reject(err) : resolve(filenames);
    });
  });

  return readDirPr.then((filenames) => {
    return Promise.all(
      filenames.map((filename) => {
        return new Promise((resolve, reject) => {
          console.log({ msg: '✅ Reading files [ ' + dirname + filename + ' ]' });
          fs.readFile(dirname + filename, 'utf-8', (err, content) => {
            if (err) {
              reject(err);
            } else {
              const fn = path.basename(filename, '.properties');
              const resp = { name: fn, content: content };
              resolve(resp);
            }
          });
        });
      })
    ).catch((error) => {
      console.error('❌ readFiles :: Error while reading files: ', error);
      Promise.reject(error);
    });
  });
};

const fillObject = (from, to) => {
  for (let key in from) {
    if (from.hasOwnProperty(key)) {
      if (Object.prototype.toString.call(from[key]) === '[object Object]') {
        if (!to.hasOwnProperty(key)) {
          to[key] = {};
        }
        fillObject(from[key], to[key]);
      } else if (!to.hasOwnProperty(key)) {
        to[key] = from[key];
      }
    }
  }
}


/**
 * Support for PhraseApp pull is not supported until next phase
 */

/**
 * @deprecated
 * mergeNbuildCreationResource used to build creation locale json file and merge that into locales which fetched from phrase app
 */
const mergeNbuildCreationResource = () => {
  const creationRes = {
    name: 'creation',
    path: path.join(__dirname, '/./../../resourcebundles/data/creation/'),
    dest: path.join(__dirname, '/./../../resourcebundles/json/'),
    src: path.join(__dirname, '/./../../sunbirdresourcebundle/'),
  }
  return new Promise((resolve, reject) => {
    readFiles(creationRes.path).then(
      (allContents) => {
        let resObj = {};
        const options = {
          sections: true,
          comments: '#', // Some INI files also consider # as a comment, if so, add it, comments: [';', '#']
          separators: '=',
          strict: true,
          namespaces: true
          // path: true
        };
        allContents.forEach((contentObj) => {
          const obj = properties.parse(contentObj.content, options);
          resObj[contentObj.name] = obj;
        });
        _.forEach(resObj, (langObj, langKey) => {
          if (
            resObj[process.env.sunbird_primary_bundle_language] &&
            langKey !== process.env.sunbird_primary_bundle_language
          ) {
            fillObject(
              resObj[process.env.sunbird_primary_bundle_language],
              resObj[langKey]
            );
          }
        });
        _.forEach(resObj, (data, lang) => {
          try {
            let newData = {}
            const json = JSON.parse(fs.readFileSync(creationRes.src + lang + '.json'));
            newData['consumption'] = json;
            newData[creationRes.name] = data;
            fs.writeFileSync(creationRes.dest + lang + '.json', JSON.stringify(newData));
          } catch (e) {
            if (!fs.existsSync(creationRes.dest)) {
              fs.mkdirSync(creationRes.dest);
            }
            fs.writeFileSync(
              creationRes.dest + lang + '.json',
              JSON.stringify({ [creationRes.name]: data })
            );
          }
        });
        resolve(true);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

/**
* @deprecated
 * pullPhraseAppLocale function will fetch json locale json files from phrase app and stored in /sunbirdresourcebundle directory
 */
const pullPhraseAppLocale = () => {
  const cmd = `node ${rbPatah} -authToken='token ${authToken}' -project='${project}' -locale='${locale}' -merge='${merge}' -fileformat='${fileformat}'`;
  exec(cmd, async (err, stdout, stderr) => {
    if (!err) {
      mergeNbuildCreationResource().then(res => {
        if (res) {
          deleteFolderRecursive(path.join(__dirname, '/./../../sunbirdresourcebundle'));
        }
      });
    }
  })
}

/**
 * @deprecated
 * Function is used to delete non empty directory 
 * @param  {path} Directory path
 */
const deleteFolderRecursive = (path) => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      const curPath = path + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

if (args.length && args[0].includes('-task')) {
  const task = args[0].slice(6);
  if (task === 'phraseAppPull' && authToken) {
    pullPhraseAppLocale();
  } else {
    buildResources();
  }
} else {
  buildResources();
}
