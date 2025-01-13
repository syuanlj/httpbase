import { Axios, AxiosRequestConfig, AxiosResponse } from "axios"
interface Base {
    host: string
    axiosInstance: Axios
    timeout: number

    get(url: string, params?: object): void
    post(url: string, params?: object): void
    //串型
    serialPromises(params: Promise<object>[]): Promise<object[]>
    //并型
    parallelPromises(params: Promise<object>[]): Promise<object[]>
}


export class HttpBase implements Base {
    host!: string
    axiosInstance!: Axios
    timeout = 1000
    headers = {
        "Content-Type": "application/json"
    }
    constructor(host: string) {
        this.host = host
        this.axiosInstance = new Axios({
            baseURL: this.host,
            timeout: this.timeout,
            headers: this.headers
        })
    }
    //串型请求
    serialPromises(params: Promise<object>[]): Promise<object[]> {
        const promise = new Promise<object[]>(async (resolve, reject) => {
            const results = Array<object>()
            for (let index = 0; index < params.length; index++) {
                const element = params[index];
                try {
                    const res = await element
                    results.push(res)
                } catch (error) {
                    results.push[error]
                }
            }
            resolve(results)
        })

        return promise
    }
    //并型请求
    async parallelPromises(params: Promise<object>[]): Promise<object[]> {
        return await Promise.all(params)
    }
    //get请求
    async get(url: string, params?: any) {
        return this.request({ url, method: 'get', params })
    }
    //post请求
    async post(url: string, params?: any) {
        return this.request({ url, method: 'post', params })
    }

    requestSerial(paramsArray: AxiosRequestConfig<any>[]) {
        const promises = new Array<Promise<object>>()
        for (let index = 0; index < paramsArray.length; index++) {
            const element = paramsArray[index];
            promises.push(this.request(element))
        }
        return this.serialPromises(promises)
    }

    requestParallel(paramsArray: AxiosRequestConfig<any>[]) {
        const promises = new Array<Promise<object>>()
        for (let index = 0; index < paramsArray.length; index++) {
            const element = paramsArray[index];
            promises.push(this.request(element))
        }
        return this.parallelPromises(promises)
    }

    request(params: AxiosRequestConfig<any>): Promise<AxiosResponse<any, any>> {
        if (!params.url?.startsWith('http')) {
            params.url = this.host + params.url
        }
        return new Promise<any>(
            (resolve: (v: any) => void, reject: (error: any) => void) => {
                // 使用axios发送GET请求
                this.axiosInstance.request({
                    headers: this.headers,
                    timeout: this.timeout,
                    ...params
                })
                    .then(reponse => {
                        // 请求成功时，解析Promise为响应的数据
                        resolve(reponse);
                    })
                    .catch(e => {
                        // 请求失败时，拒绝Promise为错误信息
                        reject(e);
                        console.error('get请求失败', e);
                    });
            },
        );
    }

}