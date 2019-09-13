const webpack = require('webpack');
const path = require('path');

const {
  CleanWebpackPlugin
} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const pagesDir = './src/pages/';
const buildDir = 'dist';

/********************
 * Entry
 ********************/
const entries = getEntries(require('glob').sync(`${pagesDir}**/*.ts`));

function getEntries(filenames) {
  const entries = {};

  filenames.forEach(filename => entries[filename.replace(pagesDir, '').replace(/\.ts$/, '')] = filename);

  return entries
}

/********************
 * Output
 ********************/
const output = {
  filename: '[name].[hash].js',
  path: path.resolve(__dirname, buildDir)
};

/********************
 * Resolve
 ********************/
const resolve = {
  extensions: ['.js', '.jsx', '.ts', '.tsx']
};

/********************
 * Plugins
 ********************/
const pages = require('glob').sync(`${pagesDir}**/*.pug`);
const plugins = [
  new webpack.ProgressPlugin(),
  new CleanWebpackPlugin(),
  new MiniCssExtractPlugin({
    filename: '[name].[hash].css'
  }),
  new CopyWebpackPlugin([{
      from: './src/images',
      to: 'images'
    },
    {
      from: './src/fonts',
      to: 'fonts'
    },
    {
      from: './src/*',
      to: '[name].[ext]',
      ignore: ['*.pug', '*.ts', '*.s[ac]ss']
    }
  ]),
  ...pages.map(page => {
    const filename = page.replace(pagesDir, '').replace(/\.pug$/, '');

    return new HtmlWebpackPlugin({
      filename: `${filename}.html`,
      template: page,
      chunks: [filename]
    });
  })
];

/********************
 * Exports
 ********************/
module.exports = (env, argv) => {
  const mode = argv.mode;
  const devParams = {};

  if (mode === 'development') {
    devParams.devServer = {
      contentBase: path.join(__dirname, 'dist'),
      port: 4200
    };
  }

  return {
    entry: entries,
    output,
    resolve,
    plugins,
    module: {
      rules: [
        getFontsRules(),
        getImagesRules(),
        getStylesRules(),
        getTypescriptsRules(),
        getTemplatesRules(mode)
      ]
    },
    ...devParams
  };
}

function getFontsRules() {
  return {
    test: /\.(woff|woff2|eot|ttf|otf)$/,
    loader: 'file-loader',
    options: {
      name: 'fonts/[name].[ext]',
    }
  };
}

function getImagesRules() {
  return {
    test: /\.(png|svg|jpe?g|gif)$/,
    loader: 'file-loader',
    options: {
      name: 'images/[name].[ext]'
    }
  };
}

function getTemplatesRules(mode) {
  return {
    test: /\.pug$/,
    loader: 'pug-loader',
    options: {
      pretty: mode === 'development'
    }
  };
}

function getTypescriptsRules() {
  return {
    test: /\.tsx?$/,
    use: 'ts-loader',
    exclude: /node_modules/
  };
}

function getStylesRules() {
  const autoprefixer = require('autoprefixer');

  return {
    test: /\.s[ac]ss$/,
    use: [
      MiniCssExtractPlugin.loader,
      'css-loader',
      {
        loader: 'postcss-loader',
        options: {
          plugins: [
            autoprefixer()
          ]
        }
      },
      "group-css-media-queries-loader",
      'sass-loader'
    ],
  };
}
