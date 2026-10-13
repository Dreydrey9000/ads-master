/** Fail closed: registration alone never grants access to the owner's account. */
export function isReportOwner(userId: string | null | undefined, ownerId: string | undefined) {
  return Boolean(userId && ownerId && userId === ownerId);
}
