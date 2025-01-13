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
    timeout = 10000
    headers = {
        "Content-Type": "application/json"
    }
    /**
     * 构造函数用于初始化Axios客户端
     * 
     * @param host {string} - 定义API的主机地址，用于设置Axios实例的baseURL
     */
    protected constructor(host: string) {
        this.host = host
        // 创建一个Axios实例，并配置基础请求参数
        this.axiosInstance = new Axios({
            baseURL: this.host, // 设置请求的默认URL前缀
            timeout: this.timeout, // 设置请求的超时时间
            headers: this.headers // 设置请求的默认头部信息
        })
    }
    /**
     * 串型请求
     * 
     * 该函数的目的是将一组Promise对象按顺序执行，并收集它们的结果
     * 这在需要确保多个异步任务按特定顺序完成时特别有用
     * 
     * @param params 一个Promise对象的数组，代表需要按顺序执行的异步任务
     * @returns 返回一个新的Promise，当所有异步任务完成时，这个Promise会解析为一个包含所有任务结果的数组
     */
    async serialPromises(params: Promise<object>[]): Promise<Array<{ success: boolean; result?: object; error?: unknown }>> {
        // 处理边界条件：如果输入数组为空，直接返回空数组
        if (params.length === 0) {
            return [];
        }

        const results: Array<{ success: boolean; result?: object; error?: unknown }> = [];

        for (let index = 0; index < params.length; index++) {
            try {
                const res = await params[index];
                results.push({ success: true, result: res });
            } catch (error) {
                results.push({ success: false, error });
            }
        }

        return results;
    }
    //并型请求
    async parallelPromises(params: Promise<object>[]): Promise<object[]> {
        return await Promise.all(params)
    }
    /**
     * 发起 GET 请求
     * 
     * @param url - 请求的 URL 地址
     * @param params - 可选参数对象，用于传递查询参数
     * @returns 返回请求的响应结果
     */
    async get(url: string, params?: any) {
        // 调用 request 方法发起 GET 请求，并传递 URL、请求方法和可选参数
        return this.request({ url, method: 'get', params })
    }
    /**
     * 发起POST请求
     * 
     * 该方法用于执行一个POST类型的HTTP请求，通常用于向服务器提交数据或请求资源
     * 它封装了更底层的request方法，简化了POST请求的发起过程
     * 
     * @param url 请求的URL地址，是请求的唯一资源定位符
     * @param params 可选参数，包含要发送的数据或请求参数
     * @returns 返回一个Promise对象，解析后包含服务器的响应
     */
    async post(url: string, params?: any) {
        return this.request({ url, method: 'post', params })
    }

    /**
     * 发起一系列请求，这些请求会一个接一个地执行
     * 
     * @param paramsArray 一个包含多个请求配置的数组
     * @returns 返回一个Promise，当所有请求都完成后解析
     * 
     * 此函数的目的是按顺序执行多个请求，而不是同时发起所有请求
     * 这对于需要按照特定顺序处理的请求或者限制并发请求数量的情况非常有用
     */
    requestSerial(paramsArray: AxiosRequestConfig<any>[]) {
        // 创建一个空数组，用于存储所有请求的Promise对象
        const promises = new Array<Promise<object>>()

        // 遍历请求配置数组
        for (let index = 0; index < paramsArray.length; index++) {
            // 获取当前请求的配置
            const element = paramsArray[index];
            // 将请求配置传给request方法发起请求，并将返回的Promise对象添加到promises数组中
            promises.push(this.request(element))
        }

        // 调用serialPromises方法按顺序执行promises数组中的所有Promise
        return this.serialPromises(promises)
    }

    /**
     * 并行发起多个请求
     * 
     * 该方法接收一个配置数组，每个配置用于发起一个HTTP请求这些请求会被并行处理，
     * 即同时发起，当所有请求完成时，方法会返回所有请求的结果这个方法主要用于需要
     * 同时获取多个资源或数据的场景，提高效率
     * 
     * @param paramsArray 请求配置数组，每个配置用于发起一个单独的HTTP请求
     * @returns 返回一个Promise，解析为所有请求的结果数组
     */
    requestParallel(paramsArray: AxiosRequestConfig<any>[]) {
        // 初始化一个Promise数组，用于存储每个请求的Promise对象
        const promises = new Array<Promise<object>>()

        // 遍历请求配置数组，为每个配置创建并发起请求
        for (let index = 0; index < paramsArray.length; index++) {
            // 获取当前请求的配置
            const element = paramsArray[index];
            // 使用当前配置发起请求，并将返回的Promise对象添加到Promise数组中
            promises.push(this.request(element))
        }

        // 并行处理所有请求，并返回结果
        return this.parallelPromises(promises)
    }

    /**
     * 发起HTTP请求
     * 
     * 此函数通过axios库发送HTTP请求，并对请求参数进行预处理，确保请求URL的正确性
     * 它封装了axios请求，以提供更灵活的请求配置和更简洁的错误处理
     * 
     * @param params 请求配置对象，包含请求的URL、方法、请求头等信息
     * @returns 返回一个Promise，该Promise会在请求成功时解析为响应数据，请求失败时拒绝为错误信息
     */
    request(params: AxiosRequestConfig<any>): Promise<AxiosResponse<any, any>> {
        // 检查请求URL是否以'http'开头，如果不是，则添加主机地址
        if (!params.url?.startsWith('http')) {
            params.url = this.host + params.url
        }
        // 创建一个新的Promise对象来处理HTTP请求的结果
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
                    });
            },
        );
    }

}