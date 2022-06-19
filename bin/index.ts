#!/usr/bin/env node
import { join } from 'path'
import { cwd } from 'process'
import fs from 'fs-extra'
import cac from 'cac'
import slash from 'slash'
import { pascalCase } from 'pascal-case'
import type { Format } from '../helper'
import { build, defaultConfig, getCwdPackage, toArray } from '../helper'

const cli = cac('pkgup')

function ensureArray(input: string): string[] {
  return Array.isArray(input) ? input : input.split(/ |,/)
}

cli.command('[...files]', 'Bundle files', { ignoreOptionDefaultValue: true })
  .option('--entry <directory|file>', 'Use a key-value pair as entry directory|files', { default: './' })
  .option('-o, --outdir <outdir>', 'Output directory', { default: 'dist' })
  .option('-f, --format <format>', 'Bundle format, "cjs", "iife", "esm"', { default: 'cjs' })
  .option('--sourcemap [inline]', 'Generate external sourcemap, or inline source: --sourcemap inline')
  .option('--minify', 'Minify bundles only for iife')
  .option('--target <target>', 'Bundle target, "es20XX" or "esnext"', { default: 'esnext' })
  .option('--dts', 'Generate declaration file')
  // .option('--dts-only', 'Emit declaration files only')
  .option('--global-name <name>', 'Global variable name for iife format', { default: 'package.name in pascal-case' })
  .option('--clean', 'Clean output directory', { default: 'enable' })
  .option('--meta', 'helper and carry package.json/*.md', { default: 'enable' })
  .option('--jsxFactory <jsxFactory>', 'Name of JSX factory function', { default: 'React.createElement' })
  .option('--platform <node|browser>', 'platform determines the format of the output', { default: 'node' })
  .action((files, flags) => {
    const options = Object.assign(defaultConfig, flags)

    if (files.length > 0)
      options.entry = files

    if (options.entry)
      options.entry = toArray(options.entry)

    if (flags.format)
      options.format = ensureArray(flags.format) as Format[]

    if (options.format)
      options.format = toArray(options.format)

    if (!options.format)
      options.format = options.platform === 'node' ? ['cjs', 'esm'] : ['cjs', 'esm', 'iife']

    if (!options.globalName) {
      const packageJson = getCwdPackage()
      let name: string = packageJson?.name || ''
      name = name.replace('@', '')
      name = pascalCase(name)
      if (name)
        options.globalName = name
    }

    options.entry = options.entry.map((p: any) => join(cwd(), p)).map(slash)

    build(options)
  })

const pkgPath = join(__dirname, '../package.json')

cli.version(fs.readJSONSync(pkgPath).version)
cli.help()
cli.parse()