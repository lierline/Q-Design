import com.sun.source.tree.*;
import com.sun.source.util.*;
import javax.tools.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Parse presentation sources only. No Android code or annotation processor runs. */
class NativeUiArguments {
    static String quote(String s) {
        StringBuilder out = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            if (c == '"' || c == '\\') out.append('\\').append(c);
            else if (c < 32) out.append(String.format("\\u%04x", (int)c));
            else out.append(c);
        }
        return out.append('"').toString();
    }
    public static void main(String[] args) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("A JDK compiler is required");
        DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
        List<String> records = new ArrayList<>();
        try (StandardJavaFileManager files = compiler.getStandardFileManager(diagnostics, null, StandardCharsets.UTF_8)) {
            JavacTask task = (JavacTask)compiler.getTask(null, files, diagnostics, List.of("-proc:none"), null, files.getJavaFileObjects(args));
            Trees trees = Trees.instance(task);
            for (CompilationUnitTree unit : task.parse()) {
                String source = unit.getSourceFile().getCharContent(true).toString();
                SourcePositions positions = trees.getSourcePositions();
                new TreePathScanner<Void, Void>() {
                    void add(String kind, String owner, Tree node) {
                        long start = positions.getStartPosition(unit, node), end = positions.getEndPosition(unit, node);
                        if (start < 0 || end < start) throw new IllegalStateException("Missing exact source span");
                        records.add("{\"package\":"+quote(unit.getPackageName().toString())+",\"kind\":"+quote(kind)+",\"owner\":"+quote(owner)+",\"line\":"+unit.getLineMap().getLineNumber(start)+",\"expression\":"+quote(source.substring((int)start,(int)end))+"}");
                    }
                    @Override public Void visitVariable(VariableTree node, Void unused) {
                        if (node.getInitializer() != null) add("variable-initializer", node.getName().toString(), node.getInitializer());
                        else if (getCurrentPath().getParentPath().getLeaf() instanceof MethodTree) add("method-parameter", node.getName().toString(), node);
                        return super.visitVariable(node, unused);
                    }
                    @Override public Void visitMethodInvocation(MethodInvocationTree node, Void unused) {
                        for (int i=0;i<node.getArguments().size();i++) add("method-argument",node.getMethodSelect().toString()+"["+i+"]",node.getArguments().get(i));
                        return super.visitMethodInvocation(node, unused);
                    }
                    @Override public Void visitNewClass(NewClassTree node, Void unused) {
                        for (int i=0;i<node.getArguments().size();i++) add("constructor-argument",node.getIdentifier().toString()+"["+i+"]",node.getArguments().get(i));
                        return super.visitNewClass(node, unused);
                    }
                    @Override public Void visitAssignment(AssignmentTree node, Void unused) {
                        add("assignment-value",node.getVariable().toString(),node.getExpression());
                        return super.visitAssignment(node, unused);
                    }
                    @Override public Void visitLiteral(LiteralTree node, Void unused) {
                        add("literal",node.getKind().toString(),node);
                        return super.visitLiteral(node, unused);
                    }
                }.scan(unit, null);
            }
        }
        if (diagnostics.getDiagnostics().stream().anyMatch(d -> d.getKind() == Diagnostic.Kind.ERROR)) throw new IllegalStateException(diagnostics.getDiagnostics().toString());
        System.out.println("["+String.join(",",records)+"]");
    }
}
