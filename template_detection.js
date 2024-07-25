// Template
// - filenames: str[] - list of filenames templates

class Template {
    constructor(title, filenames) {
        this.title = title;
        this.filenames = filenames;
    }
}

const templates = [
    new Template("PBR Metallic Roughness", [
        "${mesh}_BaseColor",
        "${mesh}_Roughness",
        "${mesh}_Metallic",
        "${mesh}_Normal",
        "${mesh}_Height",
        "${mesh}_Emissive",
    ]),
    // my example
    new Template("Random Sketchfab Template", [
        "${material}_BaseColor",
        "${material}_Roughness",
        "${material}_Metallic",
        "${material}_Normal",
        "${material}_Alpha",
    ]),
    // unity
    new Template("Unity Standard", [
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
function match_template_str(template, filename) {
    const basename = get_basename(filename);
    const re = new RegExp(
        template.replace("${mesh}", "(.+)").replace("${material}", "(.+)")
    );
    return re.test(basename);
}

function percent_match(template, filenames) {
    let match_count = 0;
    for (const filename of filenames) {
        for (const t of template) {
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
        const percent = percent_match(template.filenames, filenames);
        if (percent > best_percent) {
            best_percent = percent;
            best_template = template;
        }
    }
    return best_template;
}
