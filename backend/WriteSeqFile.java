import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.SequenceFile;
import org.apache.hadoop.io.Text;
import java.io.*;
import java.net.URI;

public class WriteSeqFile {
    public static void main(String[] args) throws Exception {
        // Accept input and output as arguments
        // Default to original paths if no args provided
        String inputFile  = args.length > 0 ? args[0] : "/home/lalit/processed_emails.txt";
        String outputPath = args.length > 1 ? args[1] : "/email_project/sequencefiles/emails.seq";

        System.out.println("Input file:  " + inputFile);
        System.out.println("Output path: " + outputPath);

        Configuration conf = new Configuration();
        conf.set("fs.defaultFS", "hdfs://localhost:9000");

        FileSystem fs = FileSystem.get(URI.create("hdfs://localhost:9000"), conf);
        Path output = new Path(outputPath);

        // Delete if exists
        if (fs.exists(output)) {
            fs.delete(output, false);
        }

        SequenceFile.Writer writer = SequenceFile.createWriter(
            conf,
            SequenceFile.Writer.file(output),
            SequenceFile.Writer.keyClass(Text.class),
            SequenceFile.Writer.valueClass(Text.class)
        );

        String[] categories = {"Primary", "Spam", "Promotions", "Social"};
        java.util.Set<String> catSet = new java.util.HashSet<>(
            java.util.Arrays.asList(categories)
        );

        BufferedReader br = new BufferedReader(new FileReader(inputFile));

        Text key   = new Text();
        Text value = new Text();
        int count   = 0;
        int skipped = 0;
        String line;

        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;

            int tabIdx = line.indexOf('\t');
            if (tabIdx < 0) { skipped++; continue; }

            String category = line.substring(0, tabIdx).trim();
            String text     = line.substring(tabIdx + 1).trim();

            if (!catSet.contains(category) || text.split("\\s+").length < 3) {
                skipped++;
                continue;
            }

            key.set("/" + category + "/email_" + count);
            value.set(text);
            writer.append(key, value);
            count++;
        }

        br.close();
        writer.close();
        fs.close();

        System.out.println("Records written: " + count);
        System.out.println("Skipped:         " + skipped);
        System.out.println("Done!");
    }
}
