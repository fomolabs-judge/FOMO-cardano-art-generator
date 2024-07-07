# Art-Generation Project

This project is designed to generate images and their related metadata, pinning each image to IPFS using the Lighthouse API. The configuration can be customized according to your needs, including API keys, names, image resolution, and storage solutions.

## Table of Contents

- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Customization](#customization)
- [Output](#output)
- [Rules Configuration](#rules-configuration)
- [License](#license)

## Getting Started

To get started with this project, follow these steps:

1. **Clone the Repository:**
  ```
   git clone https://github.com/fomolabs-judge/FOMO-cardano-art-generator.git
   cd art-generation
  ```

**Install Dependencies:**
Make sure you have Node.js installed. Then, run:

```
npm install
```

**Get a Free API Key:**
Obtain a free API key from Lighthouse Storage. This key will provide you with 1GB of storage.

## Configuration
You need to adjust the configuration file to include your own keys, names, image resolution, etc.

**Open config.json:**

```
{
    "lighthouseApiKey": "your_api_key",
    "ipfs_pining": "true",
    "attributesFolders": {
        "Background": "./layers/Background",
        "Skin": "./layers/Skin",
        "Clothes": "./layers/Clothes",
        "Mouth": "./layers/Mouth",
        "Eyes": "./layers/Eyes",
        "Head": "./layers/Head"
    },
    "outputFolder": "./output",
    "imageSize": 1000,
    "nftCount": 3333,
    "nftPrefix": "NFT_Name",
    "policyID": "you_policy_id"
}
```
**Edit the Configuration:**
Replace YOUR_LIGHTHOUSE_API_KEY with the API key you obtained from Lighthouse Storage. Adjust the name and imageResolution as per your requirements.

## Running the Project
To run the project and generate images and metadata:

**Run the Generate Script:**

```
node generate_nfts.js
```
This script will generate images and their related metadata, pinning each image to IPFS if ipfsPinning is set to true in the configuration file.
Set to false will create the metadata without a linked image src

## Customization
This project can be configured to use other storage solutions if desired. You can modify the code to integrate different APIs or storage mechanisms according to your needs.

**Update Configuration:**
Add any necessary configuration parameters to config.json.

## Output
The generated images and their related metadata will be saved in the output directory. Each image will be pinned to IPFS as it is created, ensuring that your data is stored securely and is accessible via the IPFS network.

## Rules Configuration
You can set specific rules for your generated images in the rules.json file. These rules can include themes, must and must-not match conditions, and limits on certain trait rarities.

**Example Rules Configuration**
Edit your rules.json:

```
{
  "mustBeWith": {
    "Hero": ["Cape", "Mask"],
    "Villain": ["Weapon", "EvilLaugh"]
  },
  "cannotBeWith": {
    "Bane": ["RoundGlasses", "Book", "SymbolCardano"],
    "Joker": ["RoundGlasses", "Book", "SymbolCardano"]
  },
  "rarityLimits": {
    "Cape": 50,
    "Weapon": 30,
    "EvilLaugh": 20
  },
  "mandatoryItems": ["Background"],
  "optionalItems": ["Hat", "Gloves", "Shoes"],
  "colorSchemes": {
    "Hero": ["Red", "Blue", "Gold"],
    "Villain": ["Black", "Purple", "Green"]
  },
  "themeRestrictions": {
    "Steampunk": ["Goggles", "Cogs", "Bronze"],
    "Cyberpunk": ["Neon", "TechWear", "LED"]
  }
}

```

**Edit the Rules:**
mustBeWith: Define traits that must appear together.
cannotBeWith: Define traits that cannot appear together.
rarityLimits: Set limits on how often certain traits can appear.
mandatoryItems: Define items that must be included in every generated image.
optionalItems: Define items that can optionally be included.
colorSchemes: Define color schemes for different themes.
themeRestrictions: Define trait restrictions for specific themes.

By configuring rules.json, you can control the characteristics and distribution of traits in the generated images to fit your specific requirements.

## License
This project is licensed under the MIT License.

If this helped you consider tipping some ADA to:
```
addr1q823l9q8qss4qz6dksvp5hcjp4h2fajlffq8aup0juqsguk449uj8z7tnml3xaqakdvhjuugfd2g9xd25e6zf4huamfset7h3z
```
