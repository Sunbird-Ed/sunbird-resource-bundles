# Sunbird

## sunbird-resource-bundles

Sunbird resources bundles package which helps in creating and maintaining resource bundles for Sunbird portal. It generates respective language JSON and uploads to BLOB storage.

![sunbird-resource-bundles](/docs/sunbird-resource-bundles.jpeg)

---

## License

This project is licensed under the MIT License. See LICENSE for more information.

## Table of contents

- [Usage](#usage)
- [Options](#options)
---

### Usage

1. Clone / fork repository

2. Update `.properties` file under `sunbird-resource-bundles/resourcebundles/data/` for consumption and creation respectively

3. Create a Pull Request(PR) for base repository

4. On merging PR; circleci will run the build and upload the generated JSON to BLOB storage

### Options

1. Azure Storage

  1. Required configuration for instantiating Azure Storage `build.js`

      ```
      const cloudService  = require('client-cloud-services');
      const config = {
        sunbird_azure_account_name: process.env.sunbird_azure_account_name,
        sunbird_azure_account_key: process.env.sunbird_azure_account_key,
        sunbird_azure_resourceBundle_container_name: process.env.sunbird_azure_resourceBundle_container_name,
        sunbird_cloud_storage_provider: process.env.sunbird_cloud_storage_provider
      };

      let client  = cloudService.init(config.sunbird_cloud_storage_provider);
      let storage = new client(config);
      ```

  2. Mandatory configuration

        |                     Key                     |           Description           |              Sample              |
        |:-------------------------------------------:|:-------------------------------:|:--------------------------------:|
        |          sunbird_azure_account_name         |        Azure Account Name       |                                  |
        |          sunbird_azure_account_key          |        Azure Account Key        |                                  |
        | sunbird_azure_resourceBundle_container_name | Resource Bundles Container Name |                                  |
        |        sunbird_cloud_storage_provider       |          Cloud Provider         | Either `azure` / `aws` / `gcloud` |
        |       sunbird_primary_bundle_language       |         Primary Language        |               `en`               |