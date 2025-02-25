// Some textures can represent same property in different ways for different renderers
// Theese classes are supposed to proivide some to-normal-case-from-renderer-specific-case and back conversion
// BaseTextureUnifier does nothing, texture-specific unifiers should be inherited from it
class BaseTextureUnifier {
    // unify texture
    static async to_unified(texture) {
        console.log("BaseTextureUnifier to_unified - doing nothing");
        return texture;
    }
    // convert unified texture back to original
    static async from_unified(texture) {
        console.log("BaseTextureUnifier from_unified - doing nothing");
        return texture;
    }
}
// invertor - is used for unity's smoothness
class InvertorUnifier extends BaseTextureUnifier {
    static async to_unified(texture) {
        console.log("InvertorUnifier to_unified - inverting");
        return texture.invert();
    }
    static async from_unified(texture) {
        console.log("InvertorUnifier from_unified - inverting");
        return texture.invert();
    }
}

unifiers = {
    BaseTextureUnifier: BaseTextureUnifier,
    InvertorUnifier: InvertorUnifier,
};

//Possible types of 3D textures
TextureType = {
    AmbientOcclusion: 0,
    AnisotropyAngle: 1,
    AnisotropyLevel: 2,
    BaseColor: 3,
    BlendingMask: 4,
    CoatColor: 5,
    CoatNormal: 6,
    CoatOpacity: 7,
    CoatRoughness: 8,
    CoatSpecularLevel: 9,
    Diffuse: 10,
    Displacement: 11,
    Emissive: 12,
    Glossiness: 13,
    Height: 14,
    Ior: 15,
    Metallic: 16,
    // NormalDirectX: 17, - use NormalOpenGL with InvertorUnifier for green channel
    NormalOpenGL: 17,
    Opacity: 18,
    Reflection: 19,
    Roughness: 20,
    Scattering: 21,
    ScatteringColor: 22,
    SheenColor: 23,
    SheenOpacity: 24,
    SheenRoughness: 25,
    Specular: 26,
    SpecularEdgeColor: 27,
    SpecularLevel: 28,
    Translucency: 29,
    Transmissive: 30,
};

TextureProperties = {
    [TextureType.AmbientOcclusion]: {
        default_color: 255,
    },
    [TextureType.AnisotropyAngle]: {
        default_color: 255,
    },
    [TextureType.AnisotropyLevel]: {
        default_color: 255,
    },
    [TextureType.BaseColor]: {
        default_color: 255,
    },
    [TextureType.BlendingMask]: {
        default_color: 255,
    },
    [TextureType.CoatColor]: {
        default_color: 255,
    },
    [TextureType.CoatNormal]: {
        default_color: 255,
    },
    [TextureType.CoatOpacity]: {
        default_color: 255,
    },
    [TextureType.CoatRoughness]: {
        default_color: 128,
    },
    [TextureType.CoatSpecularLevel]: {
        default_color: 255,
    },
    [TextureType.Diffuse]: {
        default_color: 255,
    },
    [TextureType.Displacement]: {
        default_color: 0,
    },
    [TextureType.Emissive]: {
        default_color: 0,
    },
    [TextureType.Glossiness]: {
        default_color: 128,
    },
    [TextureType.Height]: {
        default_color: 0,
    },
    [TextureType.Ior]: {
        default_color: 255,
    },
    [TextureType.Metallic]: {
        default_color: 0,
    },
    [TextureType.NormalOpenGL]: {
        default_color: 128,
    },
    [TextureType.Opacity]: {
        default_color: 255,
    },
    [TextureType.Reflection]: {
        default_color: 255,
    },
    [TextureType.Roughness]: {
        default_color: 128,
    },
    [TextureType.Scattering]: {
        default_color: 255,
    },
    [TextureType.ScatteringColor]: {
        default_color: 255,
    },
    [TextureType.SheenColor]: {
        default_color: 255,
    },
    [TextureType.SheenOpacity]: {
        default_color: 255,
    },
    [TextureType.SheenRoughness]: {
        default_color: 128,
    },
    [TextureType.Specular]: {
        default_color: 255,
    },
    [TextureType.SpecularEdgeColor]: {
        default_color: 255,
    },
    [TextureType.SpecularLevel]: {
        default_color: 255,
    },
    [TextureType.Translucency]: {
        default_color: 255,
    },
    [TextureType.Transmissive]: {
        default_color: 255,
    },
};

// Type representing certain channel of certain texture type
class TextureChannel {
    constructor(map_type, channel, unifier = "BaseTextureUnifier") {
        this.map_type = map_type;
        this.channel = channel; // 0 - R, 1 - G, 2 - B, 3 - A
        this.unifier = unifier;
    }
}

class Texture {
    constructor(
        name_template, // string template for texture name
        channels // array of TextureChannel
    ) {
        this.name_template = name_template;
        this.channels = channels;
    }
}

class TexturesTemplate {
    constructor(title, textures) {
        this.title = title;
        this.textures = textures;
    }
}

class AssociatedTexture {
    constructor(texture, image_file) {
        this.texture = texture;
        this.image_file = image_file;
    }
}

async function extract_channel(image, channel) {
    // if channel is out of bounds, return null
    console.log(
        "Extracting channel:",
        channel,
        "(",
        channel + 1,
        ")",
        "channels in img:",
        image.channels
    );
    if (channel >= image.channels) {
        return null;
    }
    try {
        let channel_image = await image.getChannel(channel);
        return channel_image;
    } catch (e) {
        return null;
    }
}

// TODO: Tis approach requires to have all images loaded at once
// Better to create a sorted by source image queue channels to load
// (but in this case we have to write to multiple images at once... There are things to consider)
async function getTextureChannel(associated_tex, texture_channel) {
    // Load image
    const reader = new FileReader();
    const image_src = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(associated_tex.image_file);
    });

    let image = await IJS.Image.load(image_src);

    for (const channel_pos in associated_tex.texture.channels) {
        let channel = associated_tex.texture.channels[parseInt(channel_pos)];
        if (
            channel.map_type === texture_channel.map_type &&
            channel.channel === texture_channel.channel
        ) {
            console.log(
                "Extracting channel:",
                channel,
                "pos:",
                parseInt(channel_pos)
            );
            let result = await extract_channel(image, parseInt(channel_pos));
            let unifier = unifiers[channel.unifier];
            return await unifier.to_unified(result);
        }
    }
    return null;
}

// Some default templates
const templates = [
    new TexturesTemplate("PBR Metallic Roughness", [
        new Texture("${mesh}_BaseColor", [
            new TextureChannel(TextureType.BaseColor, 0),
            new TextureChannel(TextureType.BaseColor, 1),
            new TextureChannel(TextureType.BaseColor, 2),
        ]),
        new Texture("${mesh}_Roughness", [
            new TextureChannel(TextureType.Roughness, 0),
        ]),
        new Texture("${mesh}_Metallic", [
            new TextureChannel(TextureType.Metallic, 0),
        ]),
        new Texture("${mesh}_Normal", [
            new TextureChannel(TextureType.NormalOpenGL, 0),
            new TextureChannel(TextureType.NormalOpenGL, 1),
            new TextureChannel(TextureType.NormalOpenGL, 2),
        ]),
        new Texture("${mesh}_Height", [
            new TextureChannel(TextureType.Height, 0),
        ]),
        new Texture("${mesh}_Emissive", [
            new TextureChannel(TextureType.Emissive, 0),
            new TextureChannel(TextureType.Emissive, 1),
            new TextureChannel(TextureType.Emissive, 2),
        ]),
        new Texture("${mesh}_AmbientOcclusion", [
            new TextureChannel(TextureType.AmbientOcclusion, 0),
        ]),
        new Texture("${mesh}_Opacity", [
            new TextureChannel(TextureType.Opacity, 0),
        ]),
    ]),
    new TexturesTemplate("Unity Standard", [
        new Texture("${mesh}_Albedo", [
            new TextureChannel(TextureType.BaseColor, 0),
            new TextureChannel(TextureType.BaseColor, 1),
            new TextureChannel(TextureType.BaseColor, 2),
            new TextureChannel(TextureType.Opacity, 0),
        ]),
        new Texture("${mesh}_MetallicSmoothness", [
            // here is the example of RGB=GREY case
            new TextureChannel(TextureType.Metallic, 0),
            new TextureChannel(TextureType.Metallic, 0),
            new TextureChannel(TextureType.Metallic, 0),
            new TextureChannel(TextureType.Roughness, 0, "InvertorUnifier"),
        ]),
        new Texture("${mesh}_Normal", [
            new TextureChannel(TextureType.NormalOpenGL, 0),
            new TextureChannel(TextureType.NormalOpenGL, 1),
            new TextureChannel(TextureType.NormalOpenGL, 2),
        ]),
        new Texture("${mesh}_Occlusion", [
            new TextureChannel(TextureType.AmbientOcclusion, 0),
        ]),
        new Texture("${mesh}_Emission", [
            new TextureChannel(TextureType.Emissive, 0),
            new TextureChannel(TextureType.Emissive, 1),
            new TextureChannel(TextureType.Emissive, 2),
        ]),
    ]),
];

// test - save/load templates to/from JSON
function load_template_from_json(template_json) {
    // load keeping class instances to preserve methods
    // TODO: make sure everything is loaded correctly
    // Keep same unifier class as before serialization
    let loaded_template = [JSON.parse(template_json)];
    loaded_template = loaded_template.map((t) => {
        return new TexturesTemplate(
            t.title,
            t.textures.map((texture) => {
                return new Texture(
                    texture.name_template,
                    texture.channels.map((channel) => {
                        return new TextureChannel(
                            channel.map_type,
                            channel.channel,
                            channel.unifier
                        );
                    })
                );
            })
        );
    })[0];
    console.log(loaded_template);
    return loaded_template;
}

// functions from template_detection.js

// get filenames without extension
function get_basename(filename) {
    return filename.split(".")[0];
}

// function to check if given filename can be the output of given string template
function match_template_str(str_template, filename) {
    const basename = get_basename(filename);
    const re = new RegExp(
        str_template.replace("${mesh}", "(.+)").replace("${material}", "(.+)")
    );
    return re.test(basename);
}

function percent_match(texture_templates, files) {
    let match_count = 0;
    for (const file of files) {
        for (const t of texture_templates) {
            if (match_template_str(t.name_template, file.name)) {
                match_count++;
                break;
            }
        }
    }
    return match_count / files.length;
}

// function to find best matching template for given files
function find_best_template(files, templates) {
    let best_template = null;
    let best_percent = 0;
    for (const template of templates) {
        const percent = percent_match(template.textures, files);
        if (percent > best_percent) {
            best_percent = percent;
            best_template = template;
        }
    }
    return best_template;
}

//function to filter out files with extension not in the list
function remove_non_texture_files(files) {
    const texture_extensions = [
        "png",
        "jpg",
        "jpeg",
        "tga",
        "bmp",
        "hdr",
        "hdri",
        "exr",
        "tif",
        "tiff",
        "gif",
        "webp",
        "svg",
        "psd",
        "dds",
    ];
    return files.filter((file) =>
        texture_extensions.includes(file.name.split(".").pop().toLowerCase())
    );
}

// funcion to extract mesh/material names from filenames (template is already matched)
function extract_names(str_template, filename) {
    const basename = get_basename(filename);
    const re = new RegExp(
        str_template.replace("${mesh}", "(.+)").replace("${material}", "(.+)")
    );
    return re.exec(basename).slice(1);
}

//function to return texturesets from filenames - we already know the template
function get_texturesets(template, files) {
    // dict of texture sets
    // "mesh_material": [mesh, material]
    texture_sets = {};
    //  dict of lists of AssociatedTextures
    // "setname":[AssociatedTexture]
    associated_textures = {};
    // count of mapped files
    mapped_count = 0;

    for (const file of files) {
        for (const texture_template of template.textures) {
            if (match_template_str(texture_template.name_template, file.name)) {
                const [mesh, material] = extract_names(
                    texture_template.name_template,
                    file.name
                );
                const setname = `${mesh}_${material}`;
                if (!(setname in texture_sets)) {
                    texture_sets[setname] = [mesh, material];
                }
                if (!(setname in associated_textures)) {
                    associated_textures[setname] = [];
                }
                associated_textures[setname].push(
                    new AssociatedTexture(texture_template, file)
                );
                mapped_count++;
            }
        }
    }
    return [texture_sets, associated_textures, mapped_count];
}

async function create_default_image(image_ref, texture_type) {
    let data = new Uint8Array(image_ref.width * image_ref.height);
    for (let i = 0; i < data.length; i++) {
        data[i] = TextureProperties[texture_type].default_color;
    }
    let image = await new IJS.Image(image_ref.width, image_ref.height, data, {
        kind: "GREY",
    });
    return image;
}

// create image texture from associated textures of one set
async function create_image_texture(
    associated_textures,
    set,
    texture_template
) {
    // TODO: there are not just mesh/material - redo this with dictionary
    // Name the result texture
    const result_name = texture_template.name_template
        .replace("${mesh}", set[0])
        .replace("${material}", set[1]);
    console.log(result_name);

    // Determine color mode
    var color_mode = "";
    switch (texture_template.channels.length) {
        case 1:
            color_mode = "GREY";
            break;
        case 2:
            color_mode = "GREYA";
            break;
        case 3:
            color_mode = "RGB";
            break;
        case 4:
            color_mode = "RGBA";
            break;
    }

    // Gather all channels
    var extracted_channels = [];
    for (const channel of texture_template.channels) {
        var channel_image = null;
        for (const associated_texture of associated_textures) {
            console.log("Trying to get channel:", channel);
            channel_image = await getTextureChannel(
                associated_texture,
                channel
            );
            if (channel_image !== null) {
                break;
            }
        }
        extracted_channels.push(channel_image);
    }
    console.log("Extracted channels:", extracted_channels);

    // If all channels are null, return null
    if (extracted_channels.every((c) => c === null)) {
        console.log("All channels are null");
        return null;
    }

    // Get target size from first non-null channel
    const size_ref = extracted_channels.find((c) => c !== null);
    console.log(size_ref.width, size_ref.height);

    // For all null channels, create black image of the same size
    for (let i = 0; i < extracted_channels.length; i++) {
        if (extracted_channels[i] === null) {
            extracted_channels[i] = await create_default_image(
                size_ref,
                texture_template.channels[i].map_type
            );
        }
    }

    // apply unifiers
    for (let i = 0; i < extracted_channels.length; i++) {
        console.log(texture_template);
        let unifier = unifiers[texture_template.channels[i].unifier];
        extracted_channels[i] = await unifier.from_unified(
            extracted_channels[i]
        );
    }

    console.log(
        "Extracted channels (after default images):",
        extracted_channels
    );

    // Create new image with all channels in data
    var data = new Uint8Array(
        size_ref.width * size_ref.height * extracted_channels.length
    );
    for (let i = 0; i < extracted_channels.length; i++) {
        for (let j = 0; j < extracted_channels[i].data.length; j++) {
            data[j * extracted_channels.length + i] =
                extracted_channels[i].data[j];
        }
    }
    var result_image = new IJS.Image(size_ref.width, size_ref.height, data, {
        kind: color_mode,
    });

    // Create new image with all channels
    // var result_image = new IJS.Image(size_ref.width, size_ref.height, {
    //     kind: color_mode,
    // });
    console.log(result_image);
    // for (let i = 0; i < extracted_channels.length; i++) {
    //     console.log(extracted_channels[i]);
    //     try {
    //         result_image = result_image.setChannel(extracted_channels[i], i);
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }

    return [result_name, result_image];
}

function saveAs(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
}

// Save array of [name, image] to zip and download
function download_images_zip(images, name) {
    const zip = new JSZip();
    for (const image of images) {
        zip.file(`${image[0]}.png`, image[1].toBlob("image/png"));
    }
    zip.generateAsync({ type: "blob" }).then(function (content) {
        saveAs(content, name + ".zip");
    });
}

// Generate archive name from sets
function generate_archive_name(template_title, texture_sets) {
    const max_name_length = 100;
    var name = template_title.replace(" ", "_") + "_";
    for (const set of Object.keys(texture_sets)) {
        name += `${set}_`;
    }
    name = name.slice(0, -1);
    if (name.length > max_name_length) {
        name = name.slice(0, max_name_length);
    }
    return name;
}

async function convert(
    texture_sets,
    associated_textures,
    target_template,
    progress_callback
) {
    const total_count = Object.keys(texture_sets).length;
    const result_images = [];
    for (const set of Object.keys(texture_sets)) {
        for (const texture_template of target_template.textures) {
            const result = await create_image_texture(
                associated_textures[set],
                texture_sets[set],
                texture_template
            );
            if (result !== null) {
                result_images.push(result);
            }
        }
        // TODO: Make progress_callback actually update page
        const progress = (result_images.length / total_count) * 100;
        progress_callback(progress);
    }
    if (result_images.length === 0) {
        console.log("No images to save");
        return;
    }
    download_images_zip(
        result_images,
        generate_archive_name(target_template.title, texture_sets)
    );
}
