// 투표 입력 규칙. DB를 모르는 순수 모듈이라 클라이언트 폼에서도 가져다 쓴다.

export const QUESTION_MAX_LENGTH = 200;
export const OPTION_MAX_LENGTH = 100;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;

export type QuestionError = "required" | "too_long";
export type OptionsError = "too_few" | "too_many" | "empty" | "too_long" | "duplicate";
export type PollInputErrors = { question?: QuestionError; options?: OptionsError };
