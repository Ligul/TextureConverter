// Template
// - filenames: str[] - list of filenames templates

class TexturesTemplate {
    constructor(title, filenames_templates) {
        this.title = title;
        this.filenames_templates = filenames_templates;
    }
}

const templates = [
    new TexturesTemplate("PBR Metallic Roughness", [
        "${mesh}_BaseColor",
        "${mesh}_Roughness",
        "${mesh}_Metallic",
        "${mesh}_Normal",
        "${mesh}_Height",
        "${mesh}_Emissive",
    ]),
    // my example
    new TexturesTemplate("Random Sketchfab Template", [
        "${material}_BaseColor",
        "${material}_Roughness",
        "${material}_Metallic",
        "${material}_Normal",
        "${material}_Alpha",
    ]),
    // unity
    new TexturesTemplate("Unity Standard", [
        "${mesh}_Albedo",
        "${mesh}_MetallicSmoothness",
        "${mesh}_Normal",
        "${mesh}_Occlusion",
        "${mesh}_Emission",
    ]),
];

// We need to select best matching template for the given filenames
// Conditions:
// - there are may be extra files not covered by the template
// - there are may be missing files
// - there are may be multiple sets of textures (e.g. for different materials or meshes)
// - the order of the files is not guaranteed

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

function percent_match(str_templates, filenames) {
    let match_count = 0;
    for (const filename of filenames) {
        for (const t of str_templates) {
            if (match_template_str(t, filename)) {
                match_count++;
                break;
            }
        }
    }
    return match_count / filenames.length;
}

// function to find best matching template for given filenames
function find_best_template(filenames) {
    let best_template = null;
    let best_percent = 0;
    for (const template of templates) {
        const percent = percent_match(template.filenames_templates, filenames);
        if (percent > best_percent) {
            best_percent = percent;
            best_template = template;
        }
    }
    return best_template;
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
    // "mesh_material": [mesh, material]
    sets = {};
    // hashmap
    // "setname":"file_str_template":"filename"
    files = {};
    mapped_count = 0;

    for (const filename of filenames) {
        for (const str_template of template.filenames_templates) {
            if (match_template_str(str_template, filename)) {
                const [mesh, material] = extract_names(str_template, filename);
                const setname = `${mesh}_${material}`;
                if (!(setname in sets)) {
                    sets[setname] = [mesh, material];
                }
                if (!(setname in files)) {
                    files[setname] = {};
                }
                files[setname][str_template] = filename;
                mapped_count++;
            }
        }
    }
    return [sets, files, mapped_count];
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
