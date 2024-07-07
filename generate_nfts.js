const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const lighthouse = require('@lighthouse-web3/sdk');

let config, rules;
try {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    rules = JSON.parse(fs.readFileSync('rules.json', 'utf8'));
} catch (error) {
    console.error("Error reading config or rules file:", error);
    process.exit(1);
}

const {
    lighthouseApiKey,
    attributesFolders,
    outputFolder,
    imageSize,
    nftCount,
    nftPrefix,
    policyID,
    ipfs_pining
} = config;

function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
        console.log(`Created directory: ${directory}`);
    }
}

const rarityCount = {};

function isValidCombination(combo) {
    for (const [item, requiredItems] of Object.entries(rules.mustBeWith || {})) {
        if (Object.values(combo).includes(item)) {
            for (const requiredItem of requiredItems) {
                if (!Object.values(combo).includes(requiredItem)) {
                    return false;
                }
            }
        }
    }

    for (const [item, forbiddenItems] of Object.entries(rules.cannotBeWith || {})) {
        if (Object.values(combo).includes(item)) {
            for (const forbiddenItem of forbiddenItems) {
                if (Object.values(combo).includes(forbiddenItem)) {
                    return false;
                }
            }
        }
    }

    for (const [rareItem, limit] of Object.entries(rules.rarityLimits || {})) {
        if (Object.values(combo).includes(rareItem)) {
            if ((rarityCount[rareItem] || 0) >= limit) {
                return false;
            }
        }
    }

    for (const mandatoryItem of rules.mandatoryItems || []) {
        if (!Object.keys(combo).includes(mandatoryItem)) {
            return false;
        }
    }

    for (const [schemeName, schemeItems] of Object.entries(rules.colorSchemes || {})) {
        if (schemeItems.some(item => Object.values(combo).includes(item))) {
            if (!schemeItems.every(item => Object.values(combo).includes(item))) {
                return false;
            }
        }
    }

    for (const [theme, themeItems] of Object.entries(rules.themeRestrictions || {})) {
        if (themeItems.some(item => Object.values(combo).includes(item))) {
            if (!themeItems.every(item => Object.values(combo).includes(item))) {
                return false;
            }
        }
    }

    return true;
}

function generateCombinations(n) {
    const combinations = new Set();
    const keys = [...Object.keys(attributesFolders), ...(rules.optionalItems || [])];
    
    while (combinations.size < n) {
        const combination = {};
        for (const attr of keys) {
            if (rules.optionalItems && rules.optionalItems.includes(attr) && Math.random() < 0.5) {
                continue;
            }
            
            if (!attributesFolders[attr]) {
                console.error(`Error: Attribute folder for "${attr}" is not defined in config.json`);
                continue;
            }
            
            const folderPath = path.resolve(attributesFolders[attr]);
            if (!fs.existsSync(folderPath)) {
                console.error(`Error: Attribute folder does not exist: ${folderPath}`);
                continue;
            }
            
            const files = fs.readdirSync(folderPath);
            if (files.length === 0) {
                console.error(`Error: No files found in attribute folder: ${folderPath}`);
                continue;
            }
            
            combination[attr] = path.parse(files[Math.floor(Math.random() * files.length)]).name;
        }
        
        if (Object.keys(combination).length > 0 && isValidCombination(combination)) {
            combinations.add(JSON.stringify(combination));
            Object.values(combination).forEach(item => {
                if (rules.rarityLimits && rules.rarityLimits[item]) {
                    rarityCount[item] = (rarityCount[item] || 0) + 1;
                }
            });
        }
    }
    
    if (combinations.size === 0 && n > 0) {
        console.error("Error: Unable to generate any valid combinations. Please check your config.json and rules.json files.");
        process.exit(1);
    }
    
    return Array.from(combinations).map(JSON.parse);
}

async function createNFTs(combinations) {
    const nfts = [];
    for (let idx = 0; idx < combinations.length; idx++) {
        const combo = combinations[idx];
        const canvas = createCanvas(imageSize, imageSize);
        const ctx = canvas.getContext('2d');

        for (const [attr, file] of Object.entries(combo)) {
            const imgPath = path.join(attributesFolders[attr], `${file}.png`);
            try {
                const img = await loadImage(imgPath);
                ctx.drawImage(img, 0, 0, imageSize, imageSize);
            } catch (error) {
                console.error(`Error loading image ${imgPath}:`, error);
                throw error;
            }
        }

        const nftId = String(idx + 1).padStart(4, '0');
        const imageName = `${nftPrefix}${nftId}.png`;
        const imagePath = path.join(outputFolder, 'images', imageName);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(imagePath, buffer);

        const metadata = {
            "721": {
                [policyID]: {
                    [`${nftPrefix}${nftId}`]: {
                        name: `${nftPrefix} #${nftId}`,
                        files: []
                    }
                }
            }
        };

        if (ipfs_pining === "true") {
            try {
                const uploadResponse = await lighthouse.upload(imagePath, lighthouseApiKey);
                const ipfsLink = `ipfs://${uploadResponse.data.Hash}`;

                metadata["721"][policyID][`${nftPrefix}${nftId}`].image = ipfsLink;
                metadata["721"][policyID][`${nftPrefix}${nftId}`].mediaType = "image/png";
                metadata["721"][policyID][`${nftPrefix}${nftId}`].files.push({
                    name: `${nftPrefix}${nftId}`,
                    mediaType: "image/png",
                    src: ipfsLink
                });
            } catch (error) {
                console.error(`Error creating NFT ${nftPrefix}${nftId}:`, error);
            }
        }

        Object.assign(metadata["721"][policyID][`${nftPrefix}${nftId}`], combo);
        
        const metadataPath = path.join(outputFolder, 'metadata', `${nftPrefix}${nftId}.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 4));

        nfts.push(metadata);
        console.log(`Successfully created and uploaded NFT ${nftPrefix}${nftId}`);
    }
    return nfts;
}

async function main() {
    try {
        console.log("Starting NFT generation process...");
        
        console.log("Checking output folders...");
        ensureDirectoryExists(path.join(outputFolder, 'images'));
        ensureDirectoryExists(path.join(outputFolder, 'metadata'));
        
        console.log("Generating combinations...");
        const combinations = generateCombinations(nftCount);
        console.log(`Generated ${combinations.length} valid combinations.`);
        
        console.log("Creating NFTs, uploading to IPFS, and saving metadata...");
        const nfts = await createNFTs(combinations);
        
        console.log("Saving complete metadata collection...");
        fs.writeFileSync(path.join(outputFolder, 'metadata', 'collection_metadata.json'), JSON.stringify(nfts, null, 4));
        
        console.log("NFT generation process completed successfully.");
    } catch (error) {
        console.error("An error occurred during NFT generation:");
        console.error(error);
        console.error("\nPlease check the following:");
        console.error("1. Ensure all paths in config.json are correct and accessible.");
        console.error("2. Verify that all required attribute folders exist and contain image files.");
        console.error("3. Check that the rules in rules.json are consistent with your attribute structure.");
        console.error("4. Make sure you have the necessary permissions to read/write in the specified directories.");
    }
}

main();
