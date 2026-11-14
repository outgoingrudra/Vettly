import { z } from "zod";

const mcq = z.object({
  kind: z.literal("MCQ").default("MCQ"),
  prompt: z.string().trim().min(1).max(2000),
  options: z.array(z.string().trim().min(1).max(500)).min(2).max(6),
  correctOption: z.number().int().nonnegative(),
  marks: z.number().int().min(1).max(1000).default(1),
}).refine(q =>
  q.correctOption < q.options.length &&
  new Set(q.options.map(option => option.toLowerCase())).size === q.options.length,
);
const written = z.object({
  kind: z.literal("WRITTEN"),
  prompt: z.string().trim().min(1).max(2000),
  maxWords: z.number().int().min(1).max(300),
  marks: z.number().int().min(1).max(1000).default(10),
});
export const questionList = z
  .array(z.union([mcq, written]))
  .max(100);

const answerList = z
  .array(
    z.union([
      z.object({ questionId: z.string(), selectedOption: z.number().int().nonnegative() }).strict(),
      z.object({ questionId: z.string(), text: z.string().trim().max(12000) }).strict(),
    ]),
  )
  .max(100);
export function grade(questions, input) {
  const parsed = answerList.safeParse(input);
  if (!parsed.success) return null;
  const selections = new Map();
  for (const answer of parsed.data) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (
      !question ||
      selections.has(question.id) ||
      (question.kind === "WRITTEN"
        ? typeof answer.text !== "string" || !answer.text || answer.text.trim().split(/\s+/u).length > question.maxWords
        : !Number.isInteger(answer.selectedOption) || answer.selectedOption >= question.options.length)
    )
      return null;
    selections.set(question.id, question.kind === "WRITTEN" ? answer.text : answer.selectedOption);
  }
  if (selections.size !== questions.length) return null;
  const items = questions.map((q) => {
    if (q.kind === "WRITTEN") {
      return { questionId: q.id, kind: "WRITTEN", prompt: q.prompt,
        maxWords: q.maxWords, answer: selections.get(q.id) ?? null, marks: q.marks, earned: null };
    }
    const selectedOption = selections.get(q.id) ?? null;
    return {
      questionId: q.id,
      kind: "MCQ",
      prompt: q.prompt,
      options: q.options,
      correctOption: q.correctOption,
      selectedOption,
      marks: q.marks,
      earned: selectedOption === q.correctOption ? q.marks : 0,
    };
  });
  return {
    items,
    total: items.reduce((sum, q) => sum + (q.earned || 0), 0),
    maximum: items.reduce((sum, q) => sum + q.marks, 0),
  };
}
