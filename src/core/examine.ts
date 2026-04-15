import { z } from "zod";

interface Anatomy<T extends z.ZodType> {
  name: string;
  schema: T;
  description: string | undefined;
  parse: (data: unknown) => z.infer<T>;
  safeParse: (data: unknown) => z.SafeParseReturnType<unknown, z.infer<T>>;
}

interface ExamineError {
  path: (string | number)[];
  message: string;
}

interface ExamineSuccess<T> {
  success: true;
  errors: never[];
  anatomyName: string;
  data: T;
}

interface ExamineFailure {
  success: false;
  errors: ExamineError[];
  anatomyName: string;
  data: undefined;
}

type ExamineResult<T> = ExamineSuccess<T> | ExamineFailure;

export function examine<T extends z.ZodType>(
  anatomy: Anatomy<T>,
  data: unknown
): ExamineResult<z.infer<T>> {
  const result = anatomy.safeParse(data);

  if (result.success) {
    return {
      success: true,
      errors: [],
      anatomyName: anatomy.name,
      data: result.data,
    };
  }

  const errors: ExamineError[] = result.error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }));

  return {
    success: false,
    errors,
    anatomyName: anatomy.name,
    data: undefined,
  };
}
