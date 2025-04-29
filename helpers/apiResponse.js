export function successResponse(res, msg) {
	const resData = {
		result: true,
		message: msg
	};
	return res.status(200).json(resData);
}

export function successResponseWithData(res, msg, data) {
	const resData = {
		result: true,
		message: msg,
		responseData: data
	};
	return res.status(200).json(resData);
}

export function ErrorResponse(res, msg) {
	const resData = {
		result: false,
		message: msg
	};
	return res.status(500).json(resData);
}

export function ErrorResponseWithData(res, msg, data) {
	const resData = {
		result: false,
		message: msg,
		responseData: data
	};
	return res.status(500).json(resData);
}

export function ErrorBadRequestResponseWithData(res, msg, data) {
	const resData = {
		result: false,
		message: msg,
		responseData: data
	};
	return res.status(400).json(resData);
}

export function notFoundResponse(res, msg) {
	const resData = {
		result: false,
		message: msg
	};
	return res.status(404).json(resData);
}

export function validationErrorWithData(res, msg, data) {
	const resData = {
		result: false,
		message: msg,
		responseData: data
	};
	return res.status(400).json(resData);
}

export function unauthorizedResponse(res, msg) {
	const data = {
		result: false,
		message: msg
	};
	return res.status(401).json(data);
}


