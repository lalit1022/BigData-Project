import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.mahout.classifier.naivebayes.NaiveBayesModel;
import java.net.URI;
import java.io.*;

public class extract_model {
    public static void main(String[] args) throws Exception {
        // Accept model path and output path as arguments
        String modelPath  = args.length > 0 ? args[0] : "/email_project/model";
        String outputFile = args.length > 1 ? args[1] : "/home/lalit/model_weights.txt";

        System.out.println("Model path:  " + modelPath);
        System.out.println("Output file: " + outputFile);

        Configuration conf = new Configuration();
        conf.set("fs.defaultFS", "hdfs://localhost:9000");
        FileSystem fs = FileSystem.get(URI.create("hdfs://localhost:9000"), conf);

        System.out.println("Loading Mahout Naive Bayes model...");
        NaiveBayesModel model = NaiveBayesModel.materialize(
            new Path(modelPath), conf
        );

        int numLabels   = model.numLabels();
        int numFeatures = (int) model.numFeatures();

        System.out.println("Labels:   " + numLabels);
        System.out.println("Features: " + numFeatures);

        PrintWriter pw = new PrintWriter(new FileWriter(outputFile));

        pw.println("NUM_LABELS="   + numLabels);
        pw.println("NUM_FEATURES=" + numFeatures);
        pw.println("ALPHA_I="      + model.alphaI());
        pw.println("TOTAL_WEIGHT=" + model.totalWeightSum());

        pw.println("=== LABEL_WEIGHTS ===");
        for (int i = 0; i < numLabels; i++) {
            pw.println(i + "=" + model.labelWeight(i));
        }

        pw.println("=== FEATURE_WEIGHTS ===");
        for (int label = 0; label < numLabels; label++) {
            System.out.println("Exporting label " + label + " weights...");
            for (int feature = 0; feature < numFeatures; feature++) {
                double w = model.weight(label, feature);
                if (w != 0.0) {
                    pw.println(label + "," + feature + "=" + w);
                }
            }
        }

        pw.close();
        fs.close();
        System.out.println("Done! Exported to " + outputFile);
    }
}
