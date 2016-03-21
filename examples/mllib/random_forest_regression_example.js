/*
 * Copyright 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var sparkConf = new SparkConf()
  .setAppName("Random Forest Regression Example");

var sc = new SparkContext(sparkConf);
var datapath =  ((typeof args !== "undefined") && (args.length > 1)) ? args[1] : "examples/data/mllib/sample_libsvm_data.txt";

var data = MLUtils.loadLibSVMFile(sc, datapath);

// Split the data into training and test sets (30% held out for testing)
var splits = data.randomSplit([0.7, 0.3]);
var trainingData = splits[0];
var testData = splits[1];

// Set parameters.
// Empty categoricalFeaturesInfo indicates all features are continuous.
var categoricalFeaturesInfo = {};
var numTrees = 3; // Use more in practice.
var featureSubsetStrategy = "auto"; // Let the algorithm choose.
var impurity = "variance";
var maxDepth = 4;
var maxBins = 32;
var seed = 12345;

// Train a RandomForest model.
var model = RandomForest.trainRegressor(
    trainingData,
    categoricalFeaturesInfo, 
    numTrees, 
    featureSubsetStrategy, 
    impurity, 
    maxDepth, 
    maxBins, 
    seed
);

// Evaluate model on test instances and compute test error
var predictionAndLabel = testData.mapToPair(function(p) {
    return new Tuple(model.predict(p.getFeatures()), p.getLabel());
});

var testMSE = predictionAndLabel.map(function(tup) {
    var diff = tup[0] - tup[1];
    return diff * diff;
}).reduce(function(a, b) {
    return a + b;
}) / testData.count();

print("Test Mean Squared Error: " + testMSE);
print("Learned regression forest model:\n" + model.toDebugString());

// Save and load model
model.save(sc, "target/tmp/myRandomForestRegressionModel");
var sameModel = RandomForestModel.load(
    sc,
    "target/tmp/myRandomForestRegressionModel"
);
