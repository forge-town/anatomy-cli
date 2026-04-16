import type { Anatomy } from "./anatomy.js";

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

export function examine<T>(
  anatomy: Anatomy<T>,
  data: unknown
): ExamineResult<T> {
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
