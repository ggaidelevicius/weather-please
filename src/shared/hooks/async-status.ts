export enum AsyncStatus {
	Error = 'error',
	Idle = 'idle',
	Loading = 'loading',
	Success = 'success',
}

export const isLoadingStatus = (status: AsyncStatus) =>
	status === AsyncStatus.Loading
