import {compileStyle} from '@vue/component-compiler-utils';
import fs from 'fs';
import md5 from 'md5';
import path from 'path';
import {Project, Node, SyntaxKind} from 'ts-morph';
import {Plugin} from 'vite';

export interface Options {
    isScopedCssFile?: (filepath: string) => boolean;
}

const project = new Project({
    tsConfigFilePath: findTsConfig(),
});

const hash_cache = {} as Record<string, string>;

export default function (raw_options: Options = {}): Plugin {
    const options = {
        isScopedCssFile,
        ...raw_options.isScopedCssFile,
    };

    return {
        name: 'rollup-plugin-tsx-scoped-css',

        enforce: 'pre',

        transform(code, filepath) {
            // 处理 css 文件
            if (options.isScopedCssFile!(filepath))
                return handleCssFile(code, filepath);

            // 处理 jsx/tsx 文件
            if (filepath.endsWith('sx'))
                return handleTsxFile(code, filepath, options);

            return code;
        },
    };
}

function findTsConfig() {
    let root = process.cwd();

    do {
        const config_filepath = path.join(root, 'tsconfig.json');
        if (fs.existsSync(config_filepath)) {
            return config_filepath;
        }

        root = path.normalize(path.join(root, '..'));
    } while (root !== '/');
}

function handleTsxFile(
    code: string,
    filepath: string,
    options: Options,
): string {
    const file = project.addSourceFileAtPath(filepath);

    const imports = file.getImportDeclarations().filter(_import => {
        return options.isScopedCssFile!(_import.getModuleSpecifierValue());
    });

    // 如果没有 import scoped css 文件，则不需要处理
    if (imports.length === 0) {
        return code;
    }

    const hashes: string[] = [];

    imports.forEach(_import => {
        const module_path = _import.getModuleSpecifierValue();
        let real_path = '';

        // 没有使用 paths
        if (module_path.startsWith('.')) {
            real_path = path.resolve(
                path.join(path.dirname(filepath), module_path),
            );
        } else {
            const tsconfig = project.getCompilerOptions();
            if (tsconfig.paths) {
                const aliases = {...tsconfig.paths};
                Object.keys(aliases).forEach(source => {
                    for (let target of aliases[source]) {
                        target = path.resolve(
                            path.join(tsconfig.baseUrl!, target),
                        );
                        real_path = module_path.replace(
                            source.replace('*', ''),
                            target.replace('*', ''),
                        );
                        if (fs.existsSync(real_path)) {
                            break;
                        }
                    }
                });
            }
        }

        if (fs.existsSync(real_path)) {
            const hash = getFilepathHash(real_path);
            hashes.push(hash);
        }
    });

    const jsx_elements = [
        ...file.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
        ...file.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ];

    // 遍历每一个 jsx 元素
    const hash_attrs = hashes.map(hash => `data-v-${hash}`);
    jsx_elements
        .filter((jsx_element => jsx_element.getFullText().trim() !== '<React.Fragment>'))
        .forEach((jsx_element: Node) => {
            hash_attrs.forEach(hash => {
                jsx_element.addAttribute({name: hash, initializer: '""'});
            });
        });

    const result_code = file.getFullText();
    project.removeSourceFile(file);
    return result_code;
}

function handleCssFile(source: string, filepath: string): string {
    const hash = getFilepathHash(filepath);
    const {code, errors} = compileStyle({
        source,
        filename: filepath,
        id: `data-v-${hash}`,
        scoped: true,
        trim: true,
    });
    if (errors.length) {
        console.error(errors[0]);
    }
    return code;
}

function isScopedCssFile(filepath: string) {
    return /\.scoped\.(c|le|sa|sc)ss$/.test(filepath);
}

function getFilepathHash(filepath: string) {
    filepath = path.resolve(filepath);

    let hash = hash_cache[filepath];
    if (!hash) {
        hash_cache[filepath] = hash = md5(filepath).substr(0, 8);
    }
    return hash;
}
