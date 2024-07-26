//function to load image
async function loadImage(image_src) {
    let image = await IJS.Image.load(image_src);
    return image;
}

//function to pass image unchanged
async function passImage(image) {
    return image;
}

//function to extract a channel from an image
async function extractChannel(image, channel) {
    try {
        let channel_image = await image.getChannel(channel);
        return channel_image;
    } catch (e) {
        return null;
    }
}
