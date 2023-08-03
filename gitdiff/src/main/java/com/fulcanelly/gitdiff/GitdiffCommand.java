package com.fulcanelly.gitdiff;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Spliterator;
import java.util.Spliterators;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.diff.Edit;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectReader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.eclipse.jgit.treewalk.AbstractTreeIterator;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;

import io.micronaut.configuration.picocli.PicocliRunner;
import io.micronaut.context.ApplicationContext;
import io.micronaut.context.annotation.Parameter;
import lombok.Data;
import lombok.SneakyThrows;
import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;

@Command(name = "gitdiff", description = "...", mixinStandardHelpOptions = true)
public class GitdiffCommand implements Runnable {

    @Option(names = { "-v", "--verbose" }, description = "...")
    boolean verbose;

    @Option(names = { "-p", "--path" }, description = "Path to repository", defaultValue = ".")
    String path = ".";

    public static void main(String[] args) {
        new GitdiffCommand().run();
        ;
        // PicocliRunner.run(GitdiffCommand.class, args);
    }

    Repository repository;

    @Data
    class EditRange {
        int start, finish;

        EditRange(Edit edit) {
            start = edit.getBeginB() + 1;
            finish = edit.getEndB();
        }

        Map<String, Integer> toMap() {
            return Map.of(
                    "start", start,
                    "finish", finish);
        }
    }

    @SneakyThrows
    Stream<EditRange> getChangedLinesFromDiffEntry(DiffEntry diffEntry) {
        try (var df = new DiffFormatter(null)) {
            df.setRepository(repository);
            return df.toFileHeader(diffEntry).toEditList()
                    .stream()
                    .filter(edit -> edit.getType() == Edit.Type.INSERT || edit.getType() == Edit.Type.REPLACE)
                    .map(EditRange::new);
        }
    }

    public static String prettyPrintToYaml(Map<String, Object> data) {
        DumperOptions options = new DumperOptions();
        options.setIndent(2); // Set the indentation to 2 spaces
        options.setPrettyFlow(true); // Enable pretty flow style
        options.setExplicitEnd(false);
        Yaml yaml = new Yaml(options);
        return yaml.dump(data);
    }

    @SneakyThrows
    public void run() {
        FileRepositoryBuilder builder = new FileRepositoryBuilder();

        Repository repository = builder// .setGitDir(new File("/Users/user/code/Circuits/.git"))
                .readEnvironment()
                .findGitDir()
                .build();

        this.repository = repository;

        var git = new Git(repository);

        var commit = git.log().call().iterator().next();

        var parent = commit.getParent(0);

        var diff = git.diff()
                .setNewTree(prepareTreeParser(commit.getTree()))
                .setOldTree(prepareTreeParser(parent.getTree()))
                .call();

        var result = new HashMap<String, Object>();

        for (var diffEntry : diff) {
            var file = diffEntry.getPath(DiffEntry.Side.NEW);

            var ranges = getChangedLinesFromDiffEntry(diffEntry)
                    .map(EditRange::toMap)
                    .collect(Collectors.toList());

            result.put(file, ranges);
        }

        System.out.println(prettyPrintToYaml(result));

        git.close();
    }

    public static <T> Stream<T> getStreamFromIterator(Iterator<T> iterator) {
        return StreamSupport.stream(
                Spliterators.spliteratorUnknownSize(iterator, Spliterator.ORDERED),
                false);
    }

    @SneakyThrows
    AbstractTreeIterator prepareTreeParser(RevTree tree) {

        CanonicalTreeParser treeParser = new CanonicalTreeParser();
        try (ObjectReader reader = repository.newObjectReader()) {
            treeParser.reset(reader, tree.getId());
        }

        return treeParser;
    }
}
