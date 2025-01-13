/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: import.meta.env.VITE_GH_ACCESS_KEY
});

export async function getFileContent(owner: string, repo: string, path: string): Promise<string> {
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path
    });

    if (!('content' in response.data)) {
      throw new Error('Invalid response from GitHub');
    }

    return atob(response.data.content);
  } catch (error) {
    console.error('Failed to get file content:', error);
    throw error;
  }
}

export async function saveFile(owner: string, repo: string, path: string, content: string, message?: string): Promise<void> {
  try {
    // Try to get existing file to get its SHA
    const existing = await octokit.repos.getContent({
      owner,
      repo,
      path
    }).catch(() => null);

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: message || (existing ? `Update ${path}` : `Create ${path}`),
      content: btoa(content),
      ...(existing?.data && 'sha' in existing.data ? { sha: existing.data.sha } : {}),
      branch: 'main'
    });
  } catch (error) {
    console.error('Failed to save file:', error);
    throw error;
  }
}

export async function listFiles(owner: string, repo: string, path: string): Promise<string[]> {
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path
    });

    if (!Array.isArray(response.data)) {
      return [];
    }

    return response.data
      .filter(file => file.type === 'file')
      .map(file => file.path);
  } catch (error) {
    console.error('Failed to list files:', error);
    throw error;
  }
}

export async function listRepos(): Promise<Array<{ fullName: string }>> {
  try {
    const response = await octokit.repos.listForAuthenticatedUser({
      visibility: 'all',
      affiliation: 'owner',
      sort: 'updated',
      per_page: 100
    });

    return response.data
      .filter(repo => !repo.fork && !repo.archived)
      .map(repo => ({
        fullName: repo.full_name
      }));
  } catch (error) {
    console.error('Failed to list repositories:', error);
    throw error;
  }
}

export function parseRepoString(repoString: string): { owner: string; repo: string } {
  const [owner, repo] = repoString.split('/');
  if (!owner || !repo) {
    throw new Error('Invalid repository string format. Expected "owner/repo"');
  }
  return { owner, repo };
} 