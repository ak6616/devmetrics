import { Octokit } from "@octokit/rest";
import { decryptToken } from "@/lib/crypto/tokens";

export function createOctokit(encryptedToken: string): Octokit {
  const token = decryptToken(encryptedToken);
  return new Octokit({ auth: token });
}

export function createOctokitWithToken(token: string): Octokit {
  return new Octokit({ auth: token });
}
