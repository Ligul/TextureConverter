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
    NormalDirectX: 17,
    NormalOpenGL: 18,
    Opacity: 19,
    Reflection: 20,
    Roughness: 21,
    Scattering: 22,
    ScatteringColor: 23,
    SheenColor: 24,
    SheenOpacity: 25,
    SheenRoughness: 26,
    Specular: 27,
    SpecularEdgeColor: 28,
    SpecularLevel: 29,
    Translucency: 30,
    Transmissive: 31,
};

// Type representing certain channel of certain texture type
class TextureChannel {
    constructor(map_type, channel) {
        this.map_type = map_type;
        this.channel = channel; // 0 - R, 1 - G, 2 - B, 3 - A
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
    constructor(texture, image_filename) {
        this.texture = texture;
        this.image_filename = image_filename;
    }

    // TODO: Tis approach requires to have all images loaded at once
    // Better to create a sorted by source image queue channels to load
    // (but in this case we have to write to multiple images at once... There are things to consider)
    getTextureChannel(texture_channel) {
        //TODO: load image
        throw new Error("Not implemented");

        for (const channel of this.texture.channels) {
            if (channel === texture_channel) {
                return channel;
            }
        }
        return null;
    }
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
            new TextureChannel(TextureType.Opacity, 3),
        ]),
        new Texture("${mesh}_MetallicSmoothness", [
            new TextureChannel(TextureType.Metallic, 0),
            new TextureChannel(TextureType.Roughness, 0),
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
function test_save_load() {
    console.log(templates);

    const templates_json = JSON.stringify(templates, null, 4);

    // load keeping class instances to preserve methods
    // TODO: make sure everything is loaded correctly
    const loaded_templates = JSON.parse(templates_json).map(
        (t) =>
            new TexturesTemplate(
                t.title,
                t.textures.map((t) => new Texture(t.name_template, t.channels))
            )
    );
    console.log(loaded_templates);
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

function percent_match(texture_templates, filenames) {
    let match_count = 0;
    for (const filename of filenames) {
        for (const t of texture_templates) {
            if (match_template_str(t.name_template, filename)) {
                match_count++;
                break;
            }
        }
    }
    return match_count / filenames.length;
}

// function to find best matching template for given filenames
function find_best_template(filenames, templates) {
    let best_template = null;
    let best_percent = 0;
    for (const template of templates) {
        const percent = percent_match(template.textures, filenames);
        if (percent > best_percent) {
            best_percent = percent;
            best_template = template;
        }
    }
    return best_template;
}

//function to filter out files with extension not in the list
function remove_non_texture_files(filenames) {
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
    return filenames.filter((filename) =>
        texture_extensions.includes(filename.split(".").pop().toLowerCase())
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
function get_texturesets(template, filenames) {
    // dict of texture sets
    // "mesh_material": [mesh, material]
    texture_sets = {};
    //  dict of lists of AssociatedTextures
    // "setname":[AssociatedTexture]
    associated_textures = {};
    // count of mapped files
    mapped_count = 0;

    for (const filename of filenames) {
        for (const texture_template of template.textures) {
            if (match_template_str(texture_template.name_template, filename)) {
                const [mesh, material] = extract_names(
                    texture_template.name_template,
                    filename
                );
                const setname = `${mesh}_${material}`;
                if (!(setname in texture_sets)) {
                    texture_sets[setname] = [mesh, material];
                }
                if (!(setname in associated_textures)) {
                    associated_textures[setname] = [];
                }
                associated_textures[setname].push(
                    new AssociatedTexture(texture_template, filename)
                );
                mapped_count++;
            }
        }
    }
    return [texture_sets, associated_textures, mapped_count];
}
