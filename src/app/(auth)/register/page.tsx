'use client'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { SelectField, TextField } from '@/components/Fields'
import { Logo } from '@/components/Logo'
import { SlimLayout } from '@/components/SlimLayout'
import { type Metadata } from 'next'
import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

// export const metadata: Metadata = {
//   title: 'Sign Up',
// }

export default function Register() {
  const form = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
    },
  })

  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const router = useRouter()

  const onSubmit = (values: any) => {
    setLoading(true)

    axios
      .post(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
        email: values.email,
      })
      .then((res) => {
        form.reset()
        router.push('/thankyou')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <SlimLayout>
      <div className="flex">
        <Link href="/" aria-label="Home">
          <Logo className="h-24 w-auto" />
        </Link>
      </div>
      {loading ? (
        <h1 className=" text-lg font-bold text-red-500">
          Please do not refresh the page or go back form is getting submitted
        </h1>
      ) : (
        <>
          <div className=" flex w-full flex-col items-center space-y-6">
            <h2 className="mt-6 text-center text-lg font-semibold text-gray-900">
              Get started for free by filling the form or by calling us at{' '}
            </h2>
            <Button color="blue" className=" mt-4">
              <a href="tel:+91 9084702208" className="text-white">
                +91 9084702208
              </a>
            </Button>
            <h1>Or</h1>
            {/* <p className="mt-2 text-sm text-gray-700">
        Already registered?{' '}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:underline"
        >
          Sign in
        </Link>{' '}
        to your account.
      </p> */}

            <form
              action="#"
              className="mt-10 grid w-full grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className=" w-full">
                <label htmlFor="first_name">First Name</label>
                <input
                  className="w-full rounded-md border border-gray-300 p-2"
                  type="text"
                  {...form.register('first_name', {
                    required: 'This field is required',
                    maxLength: {
                      value: 20,
                      message:
                        'First name should not be more than 20 characters',
                    },
                  })}
                />
                <p className=" text-red-500">
                  {form.formState.errors.first_name?.message &&
                    form.formState.errors.first_name?.message}
                </p>
              </div>
              <div className=" w-full">
                <label htmlFor="last_name">Last Name</label>
                <input
                  className="w-full rounded-md border border-gray-300 p-2"
                  type="text"
                  {...form.register('last_name', {
                    required: 'This field is required',
                    maxLength: {
                      value: 20,
                      message:
                        'Last name should not be more than 20 characters',
                    },
                  })}
                />
                <p className=" text-red-500">
                  {form.formState.errors.last_name?.message &&
                    form.formState.errors.last_name?.message}
                </p>
              </div>
              <div className=" col-span-2 w-full">
                <label htmlFor="phone">Phone</label>
                <input
                  className="w-full rounded-md border border-gray-300 p-2"
                  type="text"
                  {...form.register('phone', {
                    required: 'This field is required',
                    maxLength: {
                      value: 10,
                      message: 'Phone number should be 10 digits',
                    },
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Invalid phone number',
                    },
                  })}
                />
                <p className=" text-red-500">
                  {form.formState.errors.phone?.message &&
                    form.formState.errors.phone?.message}
                </p>
              </div>
              <div className=" col-span-2 w-full">
                <label htmlFor="email">Email</label>
                <input
                  className="w-full rounded-md border border-gray-300 p-2"
                  type="email"
                  {...form.register('email', {
                    required: 'This field is required',
                    pattern: {
                      value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                      message: 'Invalid email address',
                    },
                  })}
                />
                <p className=" text-red-500">
                  {form.formState.errors.email?.message &&
                    form.formState.errors.email?.message}
                </p>
              </div>
              <div className="col-span-full">
                <Button
                  // onClick={onSubmit}
                  type="submit"
                  variant="solid"
                  color="blue"
                  className="w-full"
                >
                  <span>
                    Register <span aria-hidden="true">&rarr;</span>
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </SlimLayout>
  )
}

function Input({
  label,
  className,
  type = 'text',
  error,
  ...props
}: {
  label: string
  className: string
  type: string
  error: string
}) {
  return (
    <div>
      <label htmlFor="first_name">First Name</label>
      <input type={type} id="first_name" {...props} />
      <p id="error" className=" h-8 text-red-500">
        {error && <span>{error}</span>}
      </p>
    </div>
  )
}
