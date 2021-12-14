const webpack = require('webpack');
const path = require('path');

const {
  CleanWebpackPlugin
} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");

const pagesDir = './src/pages/';
const buildDir = 'dist';

/********************
 * Entry
 ********************/
const entries = getEntries(require('glob').sync(`${pagesDir}**/*.ts`));

function getEntries(filenames) {
  const entries = {};

  filenames.forEach(
    (filename) =>
      (entries[filename.replace(pagesDir, "").replace(/\.ts$/, "")] = filename)
  );

  return entries;
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
  extensions: [".js", ".jsx", ".ts", ".tsx"],
  plugins: [new TsconfigPathsPlugin()],
};

/********************
 * Plugins
 ********************/
const pages = require("glob").sync(`${pagesDir}**/*.pug`);
const plugins = [
  new webpack.ProgressPlugin(),
  new CleanWebpackPlugin(),
  new MiniCssExtractPlugin({
    filename: "[name].[hash].css",
  }),
  new CopyWebpackPlugin({
    patterns: [
      {
        from: "./src/assets/images",
        to: "assets/images",
        noErrorOnMissing: true,
      },
      {
        from: "./src/assets/fonts",
        to: "assets/fonts",
        noErrorOnMissing: true,
      },
      {
        from: "./src/*",
        to: "[name][ext]",
        globOptions: {
          ignore: ["*.pug", "*.ts", "*.s[ac]ss"],
        },
        noErrorOnMissing: true,
      },
    ],
  }),
  ...pages.map((page) => {
    const filename = page.replace(pagesDir, "").replace(/\.pug$/, "");

    return new HtmlWebpackPlugin({
      filename: `${filename}.html`,
      template: page,
      chunks: [filename],
      inject: "body",
    });
  }),
];


/********************
 * Exports
 ********************/
module.exports = (env, argv) => {
  const mode = argv.mode;
  const devParams = {};

  if (mode === 'development') {
    devParams.devServer = {
      static: {
        directory: path.join(__dirname, 'dist')
      },
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
    ...getOptimization(),
    ...devParams
  };
}

function getOptimization() {
  return {
    optimization: {
      minimizer: [
        new ImageMinimizerPlugin({
          minimizer: {
            implementation: ImageMinimizerPlugin.imageminMinify,
            options: {
              plugins: [
                ["jpegtran", { progressive: true }],
                ["optipng", { optimizationLevel: 5 }],
              ],
            },
          },
        }),
      ],
    },
  };
}


function getFontsRules() {
  return {
    test: /\.(woff|woff2|eot|ttf|otf)$/,
    type: 'asset',
    generator: {
      filename: 'assets/fonts/[name][ext]',
    }
  };
}

function getImagesRules() {
  return {
    test: /\.(png|svg|jpe?g|gif)$/,
    type: 'asset',
    generator: {
      filename: 'assets/images/[name][ext]'
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
          postcssOptions: {
            plugins: [
              autoprefixer()
            ]
          }
        }
      },
      'group-css-media-queries-loader',
      'sass-loader'
    ],
  };
}
