import { getGeneralApiProblem } from "./sms-problem"

test("handles connection errors", () => {
  expect(getGeneralApiProblem({ problem: "CONNECTION_ERROR" } as ApiErrorResponse<null>)).toEqual({
    kind: "cannot-connect",
    temporary: true,
  })
})
