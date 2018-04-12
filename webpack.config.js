const webpack = require('webpack');
const path = require("path");

module.exports = {
    entry: {
        contributionsHub: "./scripts/contributionsHub.tsx",
        contributionsWidget: "./scripts/contributionsWidget.tsx",
        contributionsWidgetConfiguration: "./scripts/contributionsWidgetConfiguration.tsx",
    },
    output: {
        libraryTarget: "amd",
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js"
    },
    externals: [{
        "q": true,
        "react": true,
        "react-dom": true
    },
        /^TFS\//, // Ignore TFS/* since they are coming from VSTS host 
        /^VSS\//  // Ignore VSS/* since they are coming from VSTS host
    ],
    resolve: {
        alias: { "OfficeFabric": path.join(process.cwd(), 'node_modules', 'office-ui-fabric-react', 'lib-amd') },
        extensions: [".ts", ".tsx", ".js"],
    },
    mode: "development",
    devtool: "source-map",
    module: {
      rules: [
        // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
        { test: /\.tsx?$/, loader: "ts-loader" }
      ]
    } 
};