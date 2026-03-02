export enum AsyncStatus {
	Idle = 'idle',
	Loading = 'loading',
	Success = 'success',
	Error = 'error',
}

export const isLoadingStatus = (status: AsyncStatus) =>
	status === AsyncStatus.Loading
