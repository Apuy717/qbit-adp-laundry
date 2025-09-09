import fetch from "isomorphic-fetch";


const baseUrl = process.env.NEXT_PUBLIC_API_DOMAIN
class reqApi {
  /**
   * GET
   */
  public GET(url: string, overideUrl: boolean = true): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store"
      })
        .then((response: Response) => response.json())
        .then((res) => {
          return resolve(res);
        })
        .catch((err) => {
          return reject(err);
        });
    });

    return promise;
  }

  /**
   * POST
   */
  public POST(url: string, body: any, overideUrl: boolean = false): Promise<any> {
    console.log(url);

    const promise = new Promise((resolve, reject) => {
      fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
        .then((response: Response) => response.json())
        .then((res) => {
          return resolve(res);
        })
        .catch((err) => {
          return reject(err);
        });
    });

    return promise;
  }


  /**
   * PUT
   */
  public PUT(url: string, token: string, body: any): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify(body),
      })
        .then((response: Response) => response.json())
        .then((res) => {
          return resolve(res);
        })
        .catch((err) => {
          return reject(err);
        });
    });

    return promise;
  }


  /**
   * Delete
   */
  public DELETE(url: string, token: string, body: any): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify(body),
      })
        .then((response: Response) => response.json())
        .then((res) => {
          return resolve(res);
        })
        .catch((err) => {
          return reject(err);
        });
    });

    return promise;
  }

  /**
   * GET With Token
   */
  public GetWithToken(url: string, token: string, overideUrl: boolean = false): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response: Response) => response.json())
        .then((res) => {
          return resolve(res);
        })
        .catch((err) => {
          return reject(err);
        });
    });

    return promise;
  }

  /**
   * POST With Token
   */
  public PostWithToken(url: string, token: string, body: any, overideUrl: boolean = false): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
        .then((response: Response) => response.json())
        .then((res) => {
          return resolve(res);
        })
        .catch((err) => {
          return reject(err);
        });
    });

    return promise;
  }

  /**
   * Put With Token
   */
  public PutWithToken(url: string, token: string, body: any): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
        .then((response: Response) => response.json())
        .then((res) => {
          return resolve(res);
        })
        .catch((err) => {
          return reject(err);
        });
    });

    return promise;
  }


  /**
   * DELETE With Token
   */
  public DeleteWithToken(url: string, token: string, body: any): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
        .then((response: Response) => response.json())
        .then((res) => {
          return resolve(res);
        })
        .catch((err) => {
          return reject(err);
        });
    });

    return promise;
  }


  /**
   * POST Form Data With Token and Progress
   */
  public PostFormDataWithToken(
    url: string,
    token: string,
    body: FormData,
    overideUrl: boolean = false,
    progressCallback?: (progress: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", url, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      // Progress event listener
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable && progressCallback) {
          const percentComplete = (event.loaded / event.total) * 100;
          // Call the progress callback with the current progress
          progressCallback(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error("Failed to parse response JSON"));
          }
        } else {
          reject(
            new Error(
              `Request failed with status ${xhr.status}: ${xhr.statusText}`
            )
          );
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error occurred"));
      };

      // Send the FormData object
      xhr.send(body);
    });
  }
}

/* eslint import/no-anonymous-default-export: [2, {"allowNew": true}] */
export default new reqApi();