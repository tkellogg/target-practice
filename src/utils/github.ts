/**
 * Copyright 2025 Tim Kellogg
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: import.meta.env.VITE_GH_ACCESS_KEY
});

// Helper function to safely encode Unicode strings to base64
function unicodeToBase64(str: string): string {
  // First convert the string to UTF-8 bytes
  const bytes = new TextEncoder().encode(str);
  // Then convert bytes to base64 using a temporary array
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binString);
}

// Helper function to safely decode base64 to Unicode strings
function base64ToUnicode(base64: string): string {
  // First decode base64 to bytes
  const binString = atob(base64);
  // Then convert bytes to UTF-8 string
  const bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

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

    return base64ToUnicode(response.data.content.replace(/\n/g, ''));
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
      content: unicodeToBase64(content),
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

export async function checkFileExists(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path
    });
    
    if ('download_url' in response.data) {
      return response.data.download_url;
    }
    return null;
  } catch (error) {
    if ((error as any).status === 404) {
      return null;
    }
    throw error;
  }
} 